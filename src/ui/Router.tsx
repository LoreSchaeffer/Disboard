import {useWindow} from "./context/WindowContext";
import {useNavigation} from "./context/NavigationContext";
import {PlayerProvider} from "./context/PlayerContext";
import {ROUTES} from "./config/routes";
import ProfilesProvider, {useProfiles} from "./context/ProfilesProvider";
import SfxProfilesProvider, {useSfxProfiles} from "./context/SfxProfilesProvider";
import {PropsWithChildren, useEffect, useState} from "react";

const FallbackPage = () => <div>Page not found!</div>

const Router = () => {
    const {ready} = useWindow();
    const {visibleStack} = useNavigation();

    if (!ready) return null;

    return (
        <>
            {visibleStack.map((entry, index) => {
                const route = ROUTES[entry.route];
                if (!route) {
                    if (index === visibleStack.length - 1) return <FallbackPage key={entry.route}/>;
                    return null;
                }

                const Component = route.component;
                let content = route.usePlayer ? (
                    <PlayerProvider>
                        <Component/>
                    </PlayerProvider>
                ) : (
                    <Component/>
                );

                if (route.useProfiles) {
                    content = (
                        <ProfilesProvider>
                            <ProfilesWrapper>
                                {content}
                            </ProfilesWrapper>
                        </ProfilesProvider>
                    );
                } else if (route.useSfxProfiles) {
                    content = (
                        <SfxProfilesProvider>
                            <SfxProfilesWrapper>
                                {content}
                            </SfxProfilesWrapper>
                        </SfxProfilesProvider>
                    );
                }

                return (
                    <div
                        key={entry.route}
                        className="pageContainer"
                        style={{
                            zIndex: 10 + index,
                        }}
                    >
                        {content}
                    </div>
                )
            })}
        </>
    )
}

const ProfilesWrapper = ({children}: PropsWithChildren) => {
    const {ready} = useProfiles();
    if (!ready) return null;

    return children;
}

const SfxProfilesWrapper = ({children}: PropsWithChildren) => {
    const {ready} = useSfxProfiles();
    if (!ready) return null;

    return children;
}

export default Router;