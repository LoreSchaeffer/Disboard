import {BoardType, ExportGridProfile, ExportGridProfileSchema, ExportTrack, GridBtn, GridProfile, Track} from "../../types";
import {getTracksRecord, tracksStore} from "../storage/tracks-store";
import fs from "node:fs";
import archiver from "archiver";
import path from "path";
import {THUMBNAILS_DIR, TRACKS_DIR} from "../constants";
import AdmZip from "adm-zip";
import {generateUUID, generateValidFileName} from "./misc";
import {removeNameInvalidChars} from "../../shared/validation";
import {getGridProfilesStore} from "../storage/profiles-store";
import {broadcastData} from "./broadcast";
import {convertGridProfile2SbGridProfile} from "./data-converters";
import {settingsStore} from "../storage/settings-store";

const exportProfileToZip = (profileData: ExportGridProfile, destinationPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(destinationPath);

        const archive = archiver('zip', {
            zlib: {level: 9}
        });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        const jsonString = JSON.stringify(profileData, null, 2);
        archive.append(jsonString, {name: 'profile.json'});

        profileData.tracks.forEach((track) => {
            const thumbFileName = `${track.id}.jpg`;
            const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);

            if (fs.existsSync(thumbFilePath)) archive.file(thumbFilePath, {name: `thumbnails/${thumbFileName}`});

            const trackFileName = `${track.id}.mp3`;
            const tracKFilePath = path.join(TRACKS_DIR, trackFileName);

            if (fs.existsSync(tracKFilePath)) archive.file(tracKFilePath, {name: `tracks/${trackFileName}`});
        });

        archive.finalize();
    });
}

const importProfileFromZip = async (zipPath: string): Promise<{ profile: ExportGridProfile, missingTracks: Record<string, Track> }> => {
    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();

            const profileEntry = zipEntries.find(entry => entry.entryName === 'profile.json');
            if (!profileEntry) return reject(new Error("File profile.json not found in the archive."));

            const jsonString = profileEntry.getData().toString('utf8');
            const json = JSON.parse(jsonString);

            const result = ExportGridProfileSchema.safeParse(json);
            if (!result.success) return reject(new Error(`Validation failed: ${result.error.message}`));

            const profileData = result.data;
            const missingTracks = getMissingTracks(profileData.tracks);

            if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, {recursive: true});
            if (!fs.existsSync(TRACKS_DIR)) fs.mkdirSync(TRACKS_DIR, {recursive: true});

            zipEntries.forEach(entry => {
                if (entry.isDirectory) return;

                const isThumbnail = entry.entryName.startsWith('thumbnails/');
                const isTrack = entry.entryName.startsWith('tracks/');

                if (isThumbnail || isTrack) {
                    const fileName = path.basename(entry.entryName);
                    const ext = path.extname(fileName);
                    const originalId = path.basename(fileName, ext);

                    if (missingTracks[originalId]) {
                        const finalId = missingTracks[originalId].id;
                        const finalFileName = `${finalId}${ext}`;
                        const destDir = isThumbnail ? THUMBNAILS_DIR : TRACKS_DIR;

                        fs.writeFileSync(path.join(destDir, finalFileName), entry.getData());
                    }
                }
            });

            resolve({profile: profileData, missingTracks});
        } catch (e) {
            reject(e);
        }
    });
}

export const exportGridProfile = async (profile: GridProfile, dst: string): Promise<void> => {
    const savedTracks: Record<string, Track> = getTracksRecord();
    const uniqueTracks = new Map<string, ExportTrack>();

    profile.buttons.forEach((btn: GridBtn) => {
        const track: Track = savedTracks[btn.track];

        if (track && !uniqueTracks.has(track.id)) {
            const exportedTrack = {...track};
            delete exportedTrack.downloading;
            uniqueTracks.set(track.id, exportedTrack);
        }
    });

    await exportProfileToZip({...profile, tracks: Array.from(uniqueTracks.values())}, dst);
}

export const exportGridProfilesBatch = async (profiles: GridProfile[], exportDir: string): Promise<void> => {
    for (const profile of profiles) {
        try {
            let finalFileName = generateValidFileName(profile.name, profile.id);
            let counter = 1;

            while (fs.existsSync(path.join(exportDir, finalFileName))) {
                finalFileName = generateValidFileName(`${profile.name} (${counter})`, profile.id);
                counter++;
            }

            await exportGridProfile(profile, path.join(exportDir, finalFileName));
            console.log(`[Main] Profile ${profile.name} (${profile.id}) exported successfully!`);
        } catch (e) {
            console.error(`[Main] Exception occurred exporting profile ${profile.name} (${profile.id}):`, e);
        }
    }
}

export const importGridProfilesBatch = async (filePaths: string[], boardType: Exclude<BoardType, 'ambient'>): Promise<void> => {
    const profilesStore = getGridProfilesStore(boardType);
    const profiles = profilesStore.get('profiles') || [];

    const globalTracks = tracksStore.get('tracks') || [];
    let tracksUpdated = false;

    const importedProfiles: GridProfile[] = [];

    for (const filePath of filePaths) {
        try {
            const {profile, missingTracks} = await importProfileFromZip(filePath);

            if (profile.type !== boardType) {
                console.error(`Skipping '${path.basename(filePath)}': type mismatch (expected '${boardType}')`);
                continue;
            }

            const existingProfileIndex = profiles.findIndex(p => p.id === profile.id);
            const profileId = profile.id;
            let newName = profile.name;

            if (existingProfileIndex !== -1) {
                // TODO: Ask user if they want to overwrite or import as new
                // For now it will be replaced
                console.log(`[Main] Profile ID ${profile.id} already exists. Replacing existing profile...`);
                profiles.splice(existingProfileIndex, 1);

            } else {
                newName = removeNameInvalidChars(profile.name);
                let counter = 1;
                while (profiles.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
                    newName = `${removeNameInvalidChars(profile.name)} (${counter})`;
                    counter++;
                }
            }

            const updatedButtons: GridBtn[] = profile.buttons.map(btn => {
                const originalTrackId = btn.track;
                const finalTrackId = missingTracks[originalTrackId] ? missingTracks[originalTrackId].id : originalTrackId;

                return {
                    ...btn,
                    id: generateUUID(),
                    track: finalTrackId
                };
            });

            const newProfile: GridProfile = {
                id: profileId,
                name: newName,
                type: boardType,
                rows: profile.rows,
                cols: profile.cols,
                buttons: updatedButtons
            };

            Object.values(missingTracks).forEach((newTrack) => {
                globalTracks.push(newTrack);
                tracksUpdated = true;
            });

            profiles.push(newProfile);
            importedProfiles.push(newProfile);

        } catch (e) {
            console.error(`Failed to parse/import '${path.basename(filePath)}':`, e);
        }
    }

    if (tracksUpdated) {
        tracksStore.set('tracks', globalTracks);
        broadcastData('tracks:changed', globalTracks);
    }

    if (importedProfiles.length > 0) {
        profilesStore.set('profiles', profiles);
        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));

        settingsStore.set(`${boardType}.activeProfile`, importedProfiles[0].id);
        broadcastData('settings:changed', settingsStore.store);
    }
}

const areTracksEquals = (track1: Track, track2: Track): boolean => {
    return track1.id === track2.id && track1.source.type === track2.source.type && track1.source.src === track2.source.src;
}

export const getMissingTracks = (tracks: Track[]) => {
    const savedTracks: Record<string, Track> = (tracksStore.get('tracks') || []).reduce((acc: Record<string, Track>, track: Track) => {
        acc[track.id] = track;
        return acc;
    }, {});

    const missingTracks: Record<string, Track> = {};

    tracks.forEach((track: Track) => {
        if (!savedTracks[track.id]) {
            missingTracks[track.id] = track;
        } else {
            const savedTrack = savedTracks[track.id];
            if (!areTracksEquals(track, savedTrack)) missingTracks[track.id] = {...track, id: generateUUID()};
        }
    });

    return missingTracks;
}