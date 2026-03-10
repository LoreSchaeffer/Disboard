import {useNavigation} from "./context/NavigationContext";
import {PlayerProvider} from "./context/PlayerContext";
import {AppProviderName, appProviderPriorities, ROUTES} from "./config/routes";
import ProfilesProvider, {useProfiles} from "./context/ProfilesProvider";
import {FC, PropsWithChildren} from "react";

const FallbackPage = () => <div>Page not found!</div>

const PROVIDERS_MAP: Record<AppProviderName, FC<PropsWithChildren>> = {
    player: ({children}) => <PlayerProvider>{children}</PlayerProvider>,
    profiles: ({children}) => (
        <ProfilesProvider>
            <ProfilesWrapper>{children}</ProfilesWrapper>
        </ProfilesProvider>
    )
};

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

                const requiredContexts = route.contexts || [];
                const sortedContexts = [...requiredContexts].sort((a, b) => appProviderPriorities[a] - appProviderPriorities[b]);

                const content = sortedContexts.reduceRight((acc, contextName) => {
                    const ProviderComponent = PROVIDERS_MAP[contextName];
                    return <ProviderComponent>{acc}</ProviderComponent>;
                }, <Component/>);

                return (
                    <div
                        key={entry.route}
                        id={entry.route}
                        className="pageContainer"
                        style={{
                            zIndex: 10 + index,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            overflow: 'hidden'
                        }}
                    >
                        {content}
                    </div>
                );
            })}
        </>
    )
}

const ProfilesWrapper = ({children}: PropsWithChildren) => {
    const {ready} = useProfiles();
    if (!ready) return null;
    return <>{children}</>;
}

export default Router;