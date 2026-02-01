import styles from './SettingsWin.module.css';
import {useNavigation} from "../context/NavigationContext";
import Row from "../components/layout/Row";
import Col from "../components/layout/Col";
import {ElementType, ReactElement, useState} from "react";
import {PiCaretRightBold, PiHeadsetBold, PiXBold} from "react-icons/pi";
import Sidebar from "../components/settings/Sidebar";
import AudioSettingsPage from "../components/settings/AudioSettingsPage";
import DiscordSettingsPage from "../components/settings/DiscordSettingsPage";
import {FaDiscord} from "react-icons/fa6";

export type Page = {
    id: string;
    label: string;
    icon: ElementType;
    content?: ReactElement;
}

export type Category = {
    id: string;
    label: string;
    pages: Page[];
};

const SETTINGS: Category[] = [
    {
        id: 'app_settings',
        label: 'App settings',
        pages: [
            {id: 'audio', label: 'Audio', icon: PiHeadsetBold, content: <AudioSettingsPage/>},
            {id: 'discord', label: 'Discord', icon: FaDiscord, content: <DiscordSettingsPage/>}
        ]
    },
];

const SettingsWin = () => {
    const [activePage, setActivePage] = useState<{ categoryId: string, pageId: string }>({categoryId: 'app_settings', pageId: 'audio'});

    const activePageContent = SETTINGS.find(c => c.id === activePage.categoryId)?.pages
        .find(p => p.id === activePage.pageId)?.content;

    const handlePageActivation = (categoryId: string, pageId: string) => {
        setActivePage(prev => {
            if (prev.categoryId !== categoryId || prev.pageId !== pageId) return {categoryId, pageId};
            return prev;
        });
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.settings}>
                <Row noGap stretch>
                    <Col size={3} className={styles.sidebar}>
                        <Sidebar
                            categories={SETTINGS}
                            activePage={activePage}
                            onPageSelected={handlePageActivation}
                        />
                    </Col>
                    <Col size={9} className={styles.contentWrapper}>
                        <Header activePage={activePage}/>
                        <div className={styles.content}>
                            {activePageContent || <div>No content available.</div>}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

type HeaderProps = {
    activePage: { categoryId: string, pageId: string };
}

const Header = ({activePage}: HeaderProps) => {
    const {back} = useNavigation();

    const isSingleCategory = SETTINGS.length === 1;
    const categoryLabel = SETTINGS.find(c => c.id === activePage.categoryId)?.label || '';
    const pageLabel = SETTINGS.find(c => c.id === activePage.categoryId)?.pages.find(p => p.id === activePage.pageId)?.label || '';

    return (
        <div className={styles.header}>
            <PiXBold className={styles.closeBtn} onClick={back}/>
            <div className={styles.titleBlock}>
                {!isSingleCategory && (
                    <>
                        <span className={styles.title}>{categoryLabel}</span>
                        <PiCaretRightBold className={styles.titleCaret}/>
                    </>
                )}
                <span className={styles.title}>{pageLabel}</span>
            </div>
        </div>
    )
}

export default SettingsWin;