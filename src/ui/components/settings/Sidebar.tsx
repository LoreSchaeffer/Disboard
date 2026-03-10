import styles from './Sidebar.module.css';
import {clsx} from "clsx";
import {Category, Page} from "../../windows/SettingsWin";
import {useState} from "react";

type SidebarProps = {
    categories: Category[],
    activePage?: { categoryId: string, pageId: string },
    onPageSelected?: (categoryId: string, pageId: string) => void,
}

const Sidebar = ({categories, activePage, onPageSelected}: SidebarProps) => {
    const [selectedPage, setSelectedPage] = useState<{ categoryId: string, pageId: string }>(activePage);

    const handlePageSelected = (categoryId: string, pageId: string) => {
        setSelectedPage({categoryId, pageId});
        onPageSelected?.(categoryId, pageId);
    }

    return (
        <div className={styles.sidebar}>
            {categories.map((category) => (
                <div
                    key={category.id}
                    className={styles.category}
                >
                    <span className={styles.categoryLabel}>{category.label}</span>
                    {category.pages.map((page) => (
                        <SettingPageItem
                            key={page.id}
                            page={page}
                            active={selectedPage.categoryId === category.id && selectedPage.pageId === page.id}
                            onClick={() => handlePageSelected(category.id, page.id)}
                        />
                    ))}
                </div>
            ))
            }
        </div>
    )
}

type PageProps = {
    page: Page,
    active?: boolean,
    onClick?: () => void,
}

const SettingPageItem = ({page, active = false, onClick}: PageProps) => {
    const Icon = page.icon;

    return (
        <div
            className={clsx(styles.page, active && styles.active)}
            onClick={onClick}
        >
            <Icon/>
            <span>{page.label}</span>
        </div>
    )
}

export default Sidebar;