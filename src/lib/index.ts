// @ts-ignore

import { List } from "flowbite-svelte";

//export { default as Row } from "./page.row.svelte";
export { default as Page } from "./page.svelte";
export { default as Tile } from "./tile.svelte";
export { default as Row } from "./tiles.row.svelte";
export { default as Box } from "./form.box.svelte";
//export { default as TilesVerticalRow } from "./tiles.vertical.row.svelte";
export { default as Operations } from './operations.svelte'
export { default as Paper} from './paper.svelte'

export {default as Layout } from './desk.svelte'
export {default as VerticalToolbar} from './vertical.toolbar.svelte'
export {default as HorizontalToolbar} from './horizontal.toolbar.svelte'

// @ts-ignore
export { default as Icon } from "./components/icon.svelte";
export { default as IconT } from "./components/icon.ex.svelte";

export { default as Button } from './components/button.svelte';
export { default as Checkbox } from './components/checkbox.svelte';
export { default as DatePicker } from './components/date.svelte';
export { default as Edit } from './components/edit.field.svelte';
export { default as FileLoader } from './components/file.loader.svelte';
export { default as Input } from './components/inputbox.ltop.svelte';
export { default as Radio } from './components/radio.svelte';
export { default as SimpleTable } from './components/simple.table.svelte';
export { default as Title } from './components/tile.title.svelte';

export { default as Table } from './components/table/table.svelte'
export { default as TableColumn } from './components/table/column.svelte'
export { default as TableItem } from './components/table/item.svelte'

export { default as Combo } from './components/combo/combo.svelte'
export { default as ComboSource } from './components/combo/combo.source.svelte'
export { default as ComboItem } from './components/combo/combo.item.svelte'

export { default as RichEdit} from './components/document/rich.edit.svelte'
export { default as Editor} from './components/document/editor.svelte'

export { default as Spinner} from './components/delayed.spinner.svelte'
//export { default as Menu } from './components/contextmenu.svelte'
export { showMenu, showGridMenu, showFloatingToolbar, SHOW_MENU_BELOW, SHOW_MENU_ABOVE, SHOW_MENU_RIGHT, SHOW_MENU_LEFT} from './components/menu'

export { default as Fab } from './components/Fab.svelte'
export { default as Sidebar } from './components/sidebar/sidebar.svelte'
export { default as SidebarBrand } from './components/sidebar/sidebar.brand.svelte'
export { default as SidebarGroup } from './components/sidebar/sidebar.group.svelte'
export { default as SidebarItem } from './components/sidebar/sidebar.item.svelte'
export { default as SidebarList } from './components/sidebar/sidebar.list.svelte'

export { default as List} from './components/list/list.svelte'
export { default as ListTitle} from './components/list/list.title.svelte'
export { default as ListSummary} from './components/list/list.summary.svelte'
export { default as ListInserter} from './components/list/list.inserter.svelte'
export { default as ListDateProperty} from './components/list/list.date.svelte'
export { default as ListComboProperty} from './components/list/list.combo.svelte'
export { default as ListStaticProperty} from './components/list/list.static.svelte'
export { default as ListTags} from './components/list/list.tags.svelte'

export { default as Modal} from './modal.svelte'
export { default as Dialog} from './dialog.svelte'
export { default as MembersPage} from './tenant.members.svelte'
export { default as Console} from './console.svelte'

export {default as Tag} from './components/tag.svelte'
export {default as Tags} from './components/tags.svelte'

export {default as Kanban} from './components/kanban/kanban.svelte'
export {default as KanbanSource} from './components/kanban/kanban.source.svelte'
export {default as KanbanColumn} from './components/kanban/kanban.column.svelte'
export {default as KanbanTitle} from './components/kanban/kanban.title.svelte'
export {default as KanbanSummary} from './components/kanban/kanban.summary.svelte'
export {default as KanbanStaticProperty} from './components/kanban/kanban.static.svelte'
export {default as KanbanDateProperty} from './components/kanban/kanban.date.svelte'
export {default as KanbanComboProperty} from './components/kanban/kanban.combo.svelte'
export {default as KanbanTagsProperty} from './components/kanban/kanban.tags.svelte'
export {default as KanbanCallbacks} from './components/kanban/kanban.callbacks.svelte'
export {KanbanColumnTop, KanbanColumnBottom} from './components/kanban/Kanban'

export {default as Paginator} from './components/paginator.svelte'
export {default as Breadcrumb} from './components/breadcrumb.svelte'
export {
    breadcrumbAdd,
    breadcrumbParse,
    breadcrumbStringify,
    breadcrumbClipName
}   from './components/breadcrumb_utils'

export {default as EditableSpan} from './components/prose.editable.span.svelte'
export {default as EditableParagraph} from './components/prose.editable.p.svelte'

export {
    selectItem,
    activateItem,
    clearActiveItem,
    isActive,
    isSelected,
    getActive,
    getActiveItems,
    getActiveCount,
    addActiveItem,
    removeActiveItem,
    editable,
    startEditing,
    saveCurrentEditable,
    selectable,
    handleSelect,
    isDeviceSmallerThan,
    resizeImage,
    refreshToolbarOperations,
    reloadPageToolbarOperations,
    isOnScreenKeyboardVisible,
    randomString,
    UI,
    NAV_MODE_SIDEBAR,
    NAV_MODE_FULL_PAGE,
    navGetMode,
    navIsVisible,
    navGetKey,
    navShow,
    navHide,
    navToggle,
    navPrevVisibleKey,
    navAutoHide,
    
    insertAt,
    insertAfter,
    getPrev,
    getNext,
    getFirst,
    getLast,
    removeAt,
    remove, 
    swapElements,

    isValidEmail
}   from './utils'

export {
    getNiceStringDateTime,
    getFormattedStringDate, 
    getNiceStringDate,
    dayName,
    monthName} from './components/date_utils'

export {
            mainContentPageReloader,
            reloadMainContentPage,
            reloadWholeApp,
            wholeAppReloader,
            alerts,
            addAlert,
            onErrorShowAlert,
            main_sidebar_visible_store,
            navKey,
            tagsReloader,
            reloadVisibleTags,
            dark_mode_store,
            showFABAlways } from './stores.js'

export {    data_tick_store,    // tmp
            hasSelectedItem, 
            hasDataItem,
            setNavigatorTitle } from "./stores";
            
export { contextToolbarOperations, pageToolbarOperations, contextItemsStore, contextTypesStore } from './stores'   // tmp
export { informModification, informModificationEx, informItem, pushChanges, hasModifications } from './updates'   // tmp




export { default as IcH1 } from './components/document/internal/h1.icon.svelte'
export { default as IcH2 } from './components/document/internal/h2.icon.svelte'
export { default as IcH3 } from './components/document/internal/h3.icon.svelte'
export { default as IcH4 } from './components/document/internal/h4.icon.svelte'




export {    registerKicksObserver,
            unregisterKicksObserver,
            forceKicksChecking }    from './kicks.js'

export {
    i18n, extractTranslated, ext,
    setLanguages, getLanguages,
    setCurrentLanguage, getCurrentLanguage, getCurrentLanguageIdx, getCurrentLanguageKey
}   from './i18n.js'

export {i18nPreprocess} from './i18n-preprocess.js'
