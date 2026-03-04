import {useNavigation} from "./context/NavigationContext";
import {PlayerProvider} from "./context/PlayerContext";
import {ROUTES} from "./config/routes";
import GridProfilesProvider, {useGridProfiles} from "./context/GridProfilesProvider";
import {PropsWithChildren} from "react";

const FallbackPage = () => <div>Page not found!</div>

const Router = () => {
    const {visibleStack} = useNavigation();

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
                        <GridProfilesProvider>
                            <GridProfilesWrapper>
                                {content}
                            </GridProfilesWrapper>
                        </GridProfilesProvider>
                    );
                } else if (route.useSfxProfiles) {
                    content = (
                        <>
                            {content} // TODO Replace with Ambient profiles wrapper
                        </>
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

const GridProfilesWrapper = ({children}: PropsWithChildren) => {
    const {ready} = useGridProfiles();
    if (!ready) return null;

    return children;
}

export default Router;