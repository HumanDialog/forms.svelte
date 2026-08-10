<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                List,
                ListInserter,
        		mainContentPageReloader,
                Modal,
                Editable,
                focusEditable,
                onErrorShowAlert, Breadcrumb, Paper, PaperHeader,
                i18n, ext, reloadPageToolbarOperations,
                query_item_collection, showMenu, Ricon, showFloatingToolbar, get_main_object_fetch_error_description
        } from '$lib'
    import {FaTrash, FaCloudUploadAlt} from 'svelte-icons/fa'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'
    import { STATUS_ACTIVE, STATUS_ARCHIVED, STATUS_DELETED } from './consts';
    import {cache} from './cache.js'
    import {fetchComposedClipboard4Folder, transformClipboardToJSONReferences, getBrowserRecentElements4Folder, setBrowserRecentElement, recentClipboardElements} from './basket.utils'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'

    export let params = {}


    let context_item_selector
    let context_item_id
    let context_navigation
    let cache_key
    let list_assoc_name
    let main_folder_assoc_name
    let kind

    let context_item = null
    
    let project_title

    const OP_UNKNOWN = 0
    const OP_ACTIVE = 1
    const OP_TRASH = 2
    const OP_ARCHIVE = 3

    let lists_component
    let folder_component

    let pending_uploading = false;
    let failed_message = ''


    $: onParamsChanged($location, $session, $mainContentPageReloader, $querystring);


    let new_element_creator = null

    const new_list_op = (after=null) => {
        return {
            mricon: 'notebook',
            caption: '_; New list; Nueva lista; Nowa lista',
            hideToolbarCaption: true,
            action: (btt, rect) => create_new_list_from_template(after, btt, rect),
            fab: 'M01',
            tbr: 'A'
        }
    }


    async function create_new_list_from_template(after, btt, rect)
    {
        const res = await reef.get('group/ListTemplates?fields=Id,$ref,Name,Summary')
        const templates = res ? res.TaskList : []
        
        let templates_menu = []
        if(!templates || !Array.isArray(templates) || templates.length == 0)
        {
            templates_menu.push({
                caption: '_; No templates; No hay plantillas; Brak szablonów',
                disabled: true
            })
        }
        else
        {
            templates.forEach(t => {
                templates_menu.push({
                    caption: ext(t.Name),
                    description: t.Summary ? ext(t.Summary) : '',
                    action: async () => {
                        const new_list_order = lists_component.assignOrder(after)
                        const res = await reef.post(`${context_item.$ref}/CreateListFromTemplate`, {
                                        template: t.$ref,
                                        order: new_list_order})
                        if(res)
                        {
                            const new_list = res.TaskList
                            await reload_list(new_list.$ref)
                        }
                    }
                })
            })
        }

        if(!rect)
            rect = btt.getBoundingClientRect()
        showMenu(rect, templates_menu)
    }

    const new_folder_op = (after=null) => {
        return {
            caption: '_; New folder; Nueva carpeta; Nowy folder',
            hideToolbarCaption: true,
            mricon: 'folder',
            action: () => { new_element_kind='Folder';  folder_component.addRowAfter(after) },
            tbr: 'A',
            fab: 'M04'
        }
    }
    
    const new_note_op = (after=null) => {
        return {
            caption: '_; New note; Nueva nota; Nowa notatka',
            hideToolbarCaption: true,
            mricon:'file-text',
            action: () => { new_element_kind='Note';  folder_component.addRowAfter(after) },
            tbr: 'A',
            fab: 'M03'
        }
    }
    
    
    const new_task_op = (after=null) => {
        return {
            caption: '_; New task; Nueva tarea; Nowe zadanie',
            hideToolbarCaption: true,
            mricon:'square-pen',
            action: () => { new_element_kind='Task';  folder_component.addRowAfter(after) },
            tbr: 'A',
            fab: 'M02'
        }
    }
    
    const new_file_op = (after=null) => {
        return {
            caption: '_; Add file; Añadir archivo; Dodaj plik',
            hideToolbarCaption: true,
            mricon: 'file-archive',
            action: () => { new_element_kind='UploadedFile';  run_file_attacher(after) },
            tbr: 'A',
            fab: 'M01'
        }
    }

    const edit_element_op = (element, component, stitle, ssummary) => {
        return {
                    caption: '_; Edit...; Editar...; Edytuj...',
                    hideToolbarCaption: true,
                    mricon: 'pencil',
                    fab: 'M20',
                    tbr: 'A',
                    grid: [
                            {
                                caption: '_; Title; Título; Tytuł',
                                action: () =>  { component.edit(element, stitle) }
                            },
                            {
                                caption: '_; Summary; Resumen; Podsumowanie',
                                action: () =>  { component.edit(element, ssummary) }
                            }
                    ]
                }
    }

    const edit_list_op = (list) => edit_element_op(list, lists_component, 'Name', 'Summary')
    const edit_folder_element_op = (el) => edit_element_op(el, folder_component, 'Title', 'Summary')

    const move_top_op = (list, component) => {
        return {
                    caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                    hideToolbarCaption: true,
                    mricon: 'chevrons-up',
                    action: () => component.moveTop(list),
                    fab: 'M06',
                    tbr: 'A'
        }
    }

    const move_up_op = (list, component) => {
        return {
                    caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                    hideToolbarCaption: true,
                    mricon: 'chevron-up',
                    action: () => component.moveUp(list),
                    fab: 'M05',
                    tbr: 'A'
        }
    }

    const move_down_op = (list, component) => {
        return {
                    caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                    hideToolbarCaption: true,
                    mricon: 'chevron-down',
                    action: (f) => component.moveDown(list),
                    fab: 'M04',
                    tbr: 'A'
        }
    }

    const move_list_top_op = (list) => move_top_op(list, lists_component)
    const move_list_up_op = (list) => move_up_op(list, lists_component)
    const move_list_down_op = (list) => move_down_op(list, lists_component)
    const move_folder_top_op = (element) => move_top_op(element, folder_component)
    const move_folder_up_op = (element) => move_up_op(element, folder_component)
    const move_folder_down_op = (element) => move_down_op(element, folder_component)

    const delete_folder_element_op = (element) => {
        return {
            caption: '_; Delete selected item; Eliminar el elemento seleccionado; Usuń zaznaczony element',
            action: (f) => move_to_trash(element)
        }
    }

    const show_project_folder_op = () => {
        return {
            caption: '_; Show project folder; Mostrar la carpeta del proyecto; Pokaż folder projektu',
            action: (f) => push(`/folder/project/${context_item_id}`)
        }
    }

    const show_active_elements = (icon, href, fab='S01') => {
        return {
            //mricon: icon,
            caption: '_; Show active; Mostrar los activos; Pokaż aktywne',
            action: () => push(href),
            //fab: fab,
            //tbr: 'C'
        }
    }

    const show_archived_elements = (href, fab='S02') => {
        return {
            //mricon: 'archive',
            caption: '_; Show archived; Mostrar archivos; Pokaż archiwalne',
            action: () => push(href),
            //fab: fab,
            //tbr: 'C'
        }
    }

    const show_deleted_elements = (href, fab='S01') => {
        return {
            //mricon: 'trash',
            caption: '_; Show deleted; Mostrar los eliminados; Pokaż usunięte',
            action: () => push(href),
            //fab: fab,
            //tbr: 'C'
        }
    }

    const restore_list_from_archive_op = (list) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_list_from_archive(list),
        }
    }

    const restore_list_from_trash_op = (list) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_list_from_trash(list),
        }
    }

    const restore_trash_folder_element_op = (element) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_trash_folder_element(element),
        }
    }

    const restore_archived_folder_element_op = (element) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_archived_folder_element(element)
        }
    }

    async function restore_list_from_archive(list)
    {
        await reef.get(`${list.$ref}/RestoreFromArchive`);
        await reload_list(lists_component.SELECT_NEXT)
    }

    async function restore_list_from_trash(list)
    {
        await reef.get(`${list.$ref}/RestoreFromTrash`);
        await reload_list(lists_component.SELECT_NEXT)
    }

    
    const move_project_to_archive_op = (list) => {
        return {
                caption: '_; Archive project; Archivar proyecto; Archiwizuj projekt',
                action: () => move_me_to_archive(),
                disabledFunc: () => context_item ? context_item.Status != STATUS_ACTIVE : false
        }
    }


    const move_project_to_trash_op = (list) => {
        return {
                caption: '_; Delete project; Eliminar proyecto; Usuń projekt',
                action: () => move_me_to_trash(),
                disabledFunc: () => context_item ? context_item.Status == STATUS_DELETED : false
        }
    }

     async function move_to_trash(element)
    {
        let success = false

        switch(element.$type)
        {
        case 'FolderFolder':
            success = await reef.get(`${element.$ref}/Folder/MoveMeToTrash`);
            break;

        case 'FolderTask':
            success = await reef.get(`${element.$ref}/Task/MoveMeToTrash`);
            break;

        case 'FolderNote':
            success = await reef.get(`${element.$ref}/Note/MoveMeToTrash`);
            break;

        case 'FolderFile':
            success = await reef.get(`${element.$ref}/File/MoveMeToTrash`);
            break;

        case 'multi':
            {
                let refs = []
                element.forEach(i =>
                    refs.push({
                        Type: i.$type,
                        Id: i.Id,
                        Title: i.Title,
                        ref: i.$ref
                        })
                )
                success = await reef.post(`${context_item.$ref}/MoveElementsToTrash`, { items: refs });
            }
            break;
        }

        if(success)
        {
            await fetch_data();
            folder_component.reload(context_item, folder_component.SELECT_NEXT);
        }
    }

    async function restore_trash_folder_element(object)
    {
        let success = false

        switch(object.$type)
        {
        case 'FolderFolder':
            success = await reef.get(`${object.$ref}/Folder/RestoreFromTrash`);
            break;

        case 'FolderTask':
            success = await reef.get(`${object.$ref}/Task/RestoreFromTrash`);
            break;

        case 'FolderNote':
            success = await reef.get(`${object.$ref}/Note/RestoreFromTrash`);
            break;

        case 'FolderFile':
            success = await reef.get(`${object.$ref}/File/RestoreFromTrash`);
            break;

        case 'multi':
            {
                let refs = []
                object.forEach(i =>
                    refs.push({
                        Type: i.$type,
                        Id: i.Id,
                        Title: i.Title,
                        ref: i.$ref
                        })
                )
                success = await reef.post(`${context_item.$ref}/RestoreElementsFromTrash`, { items: refs } );
            }
            break;
        }

        if(success)
        {
            await fetch_data();
            folder_component.reload(context_item, folder_component.SELECT_NEXT);
        }
    }

    async function restore_archived_folder_element(object)
    {
        let success = false

        switch(object.$type)
        {
        case 'FolderFolder':
            success = await reef.get(`${object.$ref}/Folder/RestoreFromArchive`);
            break;

        case 'FolderTask':
            success = await reef.get(`${object.$ref}/Task/RestoreFromArchive`);
            break;

        case 'FolderNote':
            success = await reef.get(`${object.$ref}/Note/RestoreFromArchive`);
            break;

        case 'FolderFile':
            success = await reef.get(`${object.$ref}/File/RestoreFromArchive`);
            break;

        case 'multi':
            {
                let refs = []
                object.forEach(i =>
                    refs.push({
                        Type: i.$type,
                        Id: i.Id,
                        Title: i.Title,
                        ref: i.$ref
                        })
                )
                success = await reef.post(`${context_item.$ref}/RestoreElementsFromArchive`, { items: refs } );
            }
            break;
        }

        if(success)
        {
            await fetch_data();
            folder_component.reload(context_item, folder_component.SELECT_NEXT);
        }
    }

    async function move_me_to_archive()
    {
        if(!context_item)
            return;

        await reef.get(`${context_item.$ref}/MoveMeToArchive`)   
        await reload_list(lists_component.SELECT_NEXT)
    }

    async function move_me_to_trash()
    {
        if(!context_item)
            return;

        await reef.get(`${context_item.$ref}/MoveMeToTrash`)
        await reload_list(lists_component.SELECT_NEXT)
    }

    const show_project_active_lists_from_archive_op = () => show_active_elements('notebook', `/project/${context_item.Id}`, 'S02')
    const show_project_active_lists_from_trash_op = () => show_active_elements('notebook', `/project/${context_item.Id}`, 'S01')
    
    
    const show_project_archived_lists_op = () => {
        return show_archived_elements(`/projectarchive/${context_item.Id}`)
    }

    const show_project_deleted_lists_op = () => {
        return show_deleted_elements(`/projecttrash/${context_item.Id}`)
    }

    const empty_project_trash_op = () => {
        return {
            caption: '_; Empty the trash; Vacía la papelera; Opróżnij kosz',
            action: () => empty_project_trash(),
            tbr: 'A',
            fab: 'S00',
            mricon: 'brush-cleaning'
        }
    }

    async function empty_project_trash()
    {
        await reef.get(`${context_item.$ref}/EmptyTrash`);
        await reload_list(lists_component.CLEAR_SELECTION)
        await reload_list(folder_component.CLEAR_SELECTION)
    }

    const edit_page_op = () => {
        return {
                    caption: '_; Edit; Editar; Edytuj',
                    hideToolbarCaption: true,
                    mricon: 'pencil',
                    tbr: 'A',
                    fab:'M20',
                    grid:[
                        {
                            caption: '_; Title; Título; Tytuł',
                            action: () =>  { focusEditable('Title') },
                        },
                        {
                            caption: '_; Summary; Resumen; Podsumowanie',
                            action: () =>  { focusEditable('Summary') }
                        }
                    ]
        }
    }

    const insert_operation_op = () => {
        return {
            mricon: 'download',
            caption: '_; Insert; Insertar; Wstaw',
            hideToolbarCaption: true,
            tbr: 'C',
            fab: 'S10',
            menu: [
                {
                    caption: '_; Paste; Pegar; Wklej',
                    action: paste_recent_clipboard_element
                },
                {
                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                    action: run_paste_basket
                },
                {
                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                    action: run_paste_browser_recent
                },
                {
                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                    action: run_popup_explorer_for_select_from_folders
                },
                {
                    caption: '_; Select from task lists; Seleccionar de listas de tareas; Wybierz z listy zadań',
                    action: run_popup_explorer_for_select_from_task_lists
                }
            ]
        }
    }

    async function paste_recent_clipboard_element(btt, around_rect)
    {
        const clipboardElements = await fetchComposedClipboard4Folder()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${context_navigation}/Folders/AttachClipboard`, { references: references })
            if(res)
                refresh_view_after_attaching_from_basket(res);
        }
    }

    async function run_paste_basket(btt, around_rect)
    {
        const clipboardElements = await fetchComposedClipboard4Folder()
        showFloatingToolbar(around_rect, BasketPreview, {
            destinationContainer: `${context_navigation}/Folders`,
            onRefreshView: refresh_view_after_attaching_from_basket,
            clipboardElements: clipboardElements,
            ownCloseButton: true
        })
    }

    async function run_paste_browser_recent(btt, around_rect)
    {
        const clipboardElements = getBrowserRecentElements4Folder()
        showFloatingToolbar(around_rect, BasketPreview, {
            destinationContainer: `${context_navigation}/Folders`,
            onRefreshView: refresh_view_after_attaching_from_basket,
            clipboardElements: clipboardElements,
            browserBasedClipboard: true,
            ownCloseButton: true
        })
    }

    async function run_popup_explorer_for_select_from_folders(btt, around_rect)
    {
        showFloatingToolbar(around_rect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            destinationContainer: `${context_navigation}/Folders`,
            onRefreshView: refresh_view_after_attaching_from_basket,
            ownCloseButton: true
        })
    }

    async function run_popup_explorer_for_select_from_task_lists(btt, around_rect)
    {
        showFloatingToolbar(around_rect, PopupExplorer, {
            rootFilter: 'TASKLISTS',
            destinationContainer: `${context_navigation}/Folders`,
            onRefreshView: refresh_view_after_attaching_from_basket,
            ownCloseButton: true
        })
    }

    function error(msg)
    {
        failed_message = msg
        context_item = null
    }

    async function onParamsChanged(...args)
    {
        failed_message = ''
        const segments = $location.split('/');

        let selector_idx = 0 
        kind = OP_UNKNOWN
        
        selector_idx = segments.findIndex(s => s == 'project')
        if(selector_idx >= 0)
        {
            kind = OP_ACTIVE
        }
        else
        {
            selector_idx = segments.findIndex(s => s == 'projecttrash')
            if(selector_idx >= 0)
            {
                kind = OP_TRASH
            }
            else
            {
                selector_idx = segments.findIndex(s => s == 'projectarchive')
                if(selector_idx >= 0)
                {
                    kind = OP_ARCHIVE
                }
            }
        }
        
        context_item_selector = 0
        selector_idx++
        if(selector_idx >= segments.length)
            return error('Bad path');

        context_item_selector = segments[selector_idx]
        if(!context_item_selector)
            return error('Bad path');

        context_item_id = parseInt(context_item_selector)
        if(isNaN(context_item_id))
            return error('Bad path');

        if(context_item_id <= 0)
            return error('Bad path');

        context_navigation = `Project/${context_item_id}`
        
        switch(kind)
        {
        case OP_ACTIVE:
            cache_key = `Project_${context_item_id}_Active`;
            list_assoc_name = 'Lists'
            main_folder_assoc_name = 'Folders'
            break;

        case OP_TRASH:
            cache_key = `Project_${context_item_id}_Trash`;
            list_assoc_name = 'DeletedLists'
            main_folder_assoc_name = 'TrashFolder'
            break;

        case OP_ARCHIVE:
            cache_key = `Project_${context_item_id}_Archive`;
            list_assoc_name = 'ArchivedLists'
            main_folder_assoc_name = 'ArchiveFolder'
            break;

        default:
            break;
        }

        const cached_value = cache.get(cache_key)
        if(cached_value)
        {
            context_item = cached_value;
            project_title = ext(context_item.Title);
            context_item_id = cached_value.Id;
            lists_component?.reload(context_item, lists_component.KEEP_SELECTION)
            folder_component?.reload(context_item, folder_component.KEEP_SELECTION)
        }
        //---------------------------------------------------
        const read_item = await read_context_item(context_navigation)

        
        // dodatkowe zabezpiecznie dla przypadku kiedy pokazalismy folder, ale jego wersje z cache'a
        // i wciąż jeszcze czekamy na odpowiedź z serwisu. W międzyczasie user przeszedł do folderu niżej
        // zostajemy więc w tym komponencie, ale zmienił się parametr folderu do załadowania
        // wysyłamy więc nowe zapytanie, a to poprzednie, które wciąż jeszcze trwa, już nas nie interesuje
        if((context_item_id > 0) && (read_item.Id != context_item_id))
            return;

        context_item  = read_item
        cache.set(cache_key, context_item)
       

        if(context_item)
        {
            project_title = ext(context_item.Title);
            setup_all_elements(context_item)
        }

        lists_component?.reload(context_item, lists_component.KEEP_SELECTION)
        folder_component?.reload(context_item, folder_component.KEEP_SELECTION)
    }

    async function read_context_item(context_navigation)
    {
        let res = await reef.post(`${context_navigation}/query`,
        {
            Id: 1,
            Name: "collector",
            ExpandLevel: 3,
            Tree:
            [
            {   Id: 1, Association: '',
                Expressions:['Id','$type', '$ref', 'Title', 'Summary', 'Order', 'Status', 'href', '$ver', '$acc', 'GetCanonicalPath'],
                SubTree:[
                    {   
                        Id: 2, Association: list_assoc_name,
                        Expressions:['Id', '$type', 'Name', 'Summary', 'Order', 'href', '$ref', 'IsSubscribed', '$ver']
                    },
                    { 
                        Id: 3, Association: main_folder_assoc_name,
                        Expressions:['Id', '$ref', '$type', 'icon', 'Title','Summary', 'Kind', 'ModificationDate', 'CreatedBy', 'IsPinned', 'IsBasket', 'IsRootPinned', 'GetCanonicalPath', '$ver', 'Status'],
                        SubTree:[
                            {   
                                Id: 31, Association: 'Folders',
                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket' , 'IsCanonical',  'icon', 'FolderId', '$type', '$ver']
                            },
                            { 
                                Id: 32, Association: 'Notes',
                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'NoteId', '$type', '$ver']
                            },
                            {
                                Id: 33,
                                Association: 'Tasks',
                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'ListName', 'DueDate', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'icon', 'TaskId', '$type', '$ver']

                            },
                            {
                                Id: 34,
                                Association: 'Files',
                                Expressions:['Id', 'FileId', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'FileId', '$type', '$ver']

                            }
                        ]
                    }
                ]
            }
        ]
        }, handle_fetch_error);

        if(res)
        {
            const project_item = res.Project
            return project_item;
        }
        else
            return null;
    }

    function handle_fetch_error(err, res)
    {
        context_item = null
        failed_message = get_main_object_fetch_error_description(err, res)
    }

    function setup_all_elements(context_item)
    {
        context_item.all_folder_elements = []

        const main_folder = context_item[main_folder_assoc_name]
        if(main_folder)
        {
            if(main_folder.Folders)
                context_item.all_folder_elements = [...context_item.all_folder_elements, ...main_folder.Folders]

            if(main_folder.Notes)
                context_item.all_folder_elements = [...context_item.all_folder_elements, ...main_folder.Notes]

            if(main_folder.Tasks)
                context_item.all_folder_elements = [...context_item.all_folder_elements, ...main_folder.Tasks]

            if(main_folder.Files)
                context_item.all_folder_elements = [...context_item.all_folder_elements, ...main_folder.Files]

            context_item.all_folder_elements.sort((a,b) => a.Order - b.Order)
        }

        //const lists = context_item[list_assoc_name]
        //if(lists)
        //    context_item.all_folder_elements = [...lists, ...context_item.all_folder_elements]
        
    }

    async function fetch_data()
    {
        context_item = await read_context_item(context_navigation);
        cache.set(cache_key, context_item)
        if(context_item)
        {
            project_title = ext(context_item.Title);
            setup_all_elements(context_item)
        }
    }


    async function reload_list(select_recommendation)
    {
        await fetch_data();
        lists_component.reload(self, select_recommendation);
    }


    async function add_list(newListAttribs)
    {
        let newElement
        if(!new_element_creator)
            return null;

        newElement = await new_element_creator(newListAttribs)
        if(!newElement)
            return null;

        await reload_list(newElement.$ref)
    }

    let att_input_element;
    let insert_file_after_element = null;
    function run_file_attacher(after)
    {
        insert_file_after_element = after
        att_input_element?.click();
    }

    async function on_attachement_selected()
    {
        const [file] = att_input_element.files;
        if(file)
        {
            pending_uploading = true

            const fileOrder = folder_component.assignOrder(insert_file_after_element)

            let file_link = await reef.post(`${context_navigation}/Folders/CreateFile`,
                                    {
                                        title: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        order: fileOrder
                                    })
            if(!file_link)
                return null;

            file_link = file_link.FolderFile

            const res = await reef.post(`UploadedFile/${file_link.FileId}/Key/blob?name=${file.name}&size=${file.size}`, {})
            if(res && res.key && res.uploadUrl)
            {
                const newKey = res.key;
                const uploadUrl = res.uploadUrl

                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': file.type
                                                }),
                                                body: file})
                    if(res.ok)
                    {
                        setBrowserRecentElement(file_link.FileId, 'UploadedFile')
                    }
                    else
                    {
                        const err = await res.text()
                        console.error(err)
                        onErrorShowAlert(err)
                    }

                }
                catch(err)
                {
                    console.error(err)
                    onErrorShowAlert(err)
                }
            }

            pending_uploading = false;

            await fetch_data();
            folder_component.reload(context_item, file_link.$ref);
        }
    }
    
    async function download_file(element)
    {
        //await new Promise(r => setTimeout(r, 5000));

        const res = await reef.fetch(`json/anyv/${element.href}`, onErrorShowAlert);
        if(res.ok)
        {
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a"); // Or maybe get it from the current document
            link.href = blobUrl;
            link.download = element.Title;

            //document.body.appendChild(link); // Or append it whereever you want
            link.click() //can add an id to be specific if multiple anchor tag, and use #id


            URL.revokeObjectURL(blobUrl)

            setBrowserRecentElement(element.FileId, 'UploadedFile')
        }
        else
        {
            const err = await res.text()
            console.error(err)
            onErrorShowAlert(err)
        }
    }



    let new_element_kind = ''
    async function add_folder_element(new_element_attribs)
    {
        switch(new_element_kind)
        {
        case 'Folder':
        case 'FolderFolder':
            return await add_folder(new_element_attribs)

        case 'Note':
        case 'FolderNote':
            return await add_note(new_element_attribs)

        case 'Task':
        case 'FolderTask':
            return await add_task(new_element_attribs)

        case 'UploadedFile':
        case 'FolderFile':
            return await add_file(new_element_attribs)
        }
    }

    async function add_task(new_task_attribs)
    {
        let res = await reef.post(`${context_navigation}/Folders/CreateTaskEx`,{ properties: new_task_attribs })
        if(!res)
            return null;

        let new_task = res.FolderTask;
        setBrowserRecentElement(new_task.TaskId, 'Task')

        await fetch_data();
        folder_component.reload(context_item, new_task.$ref);
    }

    async function add_note(new_note_attribs)
    {
        let res = await reef.post(`${context_navigation}/Folders/CreateNoteEx`,{ properties: new_note_attribs })
        if(!res)
            return null;

        let new_note = res.FolderNote;
        setBrowserRecentElement(new_note.NoteId, 'Note')

        await fetch_data();
        folder_component.reload(context_item, new_note.$ref);
    }

    async function add_file(new_file_attribs)
    {
        let res = await reef.post(`${context_navigation}/Folders/CreateFileEx`,{ properties: new_file_attribs })
        if(!res)
            return null;

        let new_file = res.FolderFile;

        await fetch_data();
        folder_component.reload(context_item, new_file.$ref);
    }

    async function add_folder(new_folder_attribs)
    {
        let res = await reef.post(`${context_navigation}/Folders/CreateSubFolder`,{
            title: new_folder_attribs.Title,
            summary:  new_folder_attribs.Summary,
            order: new_folder_attribs.Order,
            kind: 0
        })
        if(!res)
            return null;

        let new_folder = res.FolderFolder;

        await fetch_data();
        folder_component.reload(context_item, new_folder.$ref);
    }

    async function refresh_view_after_attaching_from_basket(f)
    {
        await fetch_data();
        folder_component.reload(context_item, folder_component.CLEAR_SELECTION)
    }

    const operations = {
        active: {
            page: {
                new: [new_list_op, new_folder_op, new_note_op, new_task_op, new_file_op],
                view: [edit_page_op, insert_operation_op, show_project_folder_op, move_project_to_archive_op, move_project_to_trash_op, show_project_archived_lists_op, show_project_deleted_lists_op]
            },
            list: {
                new: [new_list_op],
                file: [edit_list_op, move_list_top_op, move_list_up_op, move_list_down_op],
                view: [insert_operation_op, show_project_folder_op, move_project_to_archive_op, move_project_to_trash_op, show_project_archived_lists_op, show_project_deleted_lists_op]
            },
            folder: {
                new: [new_folder_op, new_note_op, new_task_op, new_file_op],
                file: [edit_folder_element_op, move_folder_top_op, move_folder_up_op, move_folder_down_op, delete_folder_element_op],
                view: [insert_operation_op, show_project_folder_op, move_project_to_archive_op, move_project_to_trash_op, show_project_archived_lists_op, show_project_deleted_lists_op]
            }
        },
        trash: {
            page: {
                view: [empty_project_trash_op, show_project_archived_lists_op, show_project_active_lists_from_trash_op]
            },
            list: {
                file: [restore_list_from_trash_op],
                view: [empty_project_trash_op, show_project_archived_lists_op, show_project_active_lists_from_trash_op]
            },
            folder: {
                file: [restore_trash_folder_element_op],
                view: [empty_project_trash_op, show_project_archived_lists_op, show_project_active_lists_from_trash_op]
            }
        },
        archive: {
            page: {
                view: [show_project_active_lists_from_archive_op, show_project_deleted_lists_op]
            },
            list: {
                file: [restore_list_from_archive_op],
                view: [show_project_active_lists_from_archive_op, show_project_deleted_lists_op]
            },
            folder: {
                file: [restore_archived_folder_element_op],
                view: [show_project_active_lists_from_archive_op, show_project_deleted_lists_op]
            }
        }
    }

    function get_page_operations()
    {
        switch(kind)
        {
        case OP_ACTIVE:
            return compose_operations(operations.active.page);
        case OP_TRASH:
            return compose_operations(operations.trash.page);
        case OP_ARCHIVE:
            return compose_operations(operations.archive.page);
        default:
            return []
        }
    }

    function get_list_operations(selected_element)
    {
        switch(kind)
        {
        case OP_ACTIVE:
            return compose_operations(operations.active.list, selected_element);
        case OP_TRASH:
            return compose_operations(operations.trash.list, selected_element);
        case OP_ARCHIVE:
            return compose_operations(operations.archive.list, selected_element);
        default:
            return []
        }
    }

    function get_folder_operations(selected_element)
    {
        switch(kind)
        {
        case OP_ACTIVE:
            return compose_operations(operations.active.folder, selected_element);
        case OP_TRASH:
            return compose_operations(operations.trash.folder, selected_element);
        case OP_ARCHIVE:
            return compose_operations(operations.archive.folder, selected_element);
        default:
            return []
        }
    }

    function compose_operations(def, selectedObject=null)
    {
        let root_op = {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: []
        }

        const sections = Object.keys(def)
        sections.forEach(section => {
            const operations = def[section].map(op => op(selectedObject))
            
            switch(section)
            {
            case 'new':
                root_op.operations.push({
                    caption: '_; New; New; Nowy',
                    operations: operations
                })
                break;

            case 'view':
                root_op.operations.push({
                    caption: '_; View; Ver; Widok',
                    operations: operations
                })
                break;

            case 'file':
                root_op.operations.push({
                    caption: '_; File; Archivo; Plik',
                    operations: operations
                })
                break;
            }
        })

        return root_op;
    }


    const list_properties = {
        element:{
            Title: "Title",
            icon: "icon",
            href: "href",
            Summary: "Summary"
        },
        context:{
            FolderFile:{
                downloadable: true,
                onOpen: download_file
            },

            TaskList:{
                icon: "#notebook",
                Title: 'Name'
            }
        }
    }

</script>

<svelte:head>
    <title>{ext(project_title)} | {__APP_TITLE__}</title>
</svelte:head>

{#if context_item}
    {#key context_item}
        <Page   self={context_item}
                toolbarOperations={get_page_operations()}
                clearsContext='props sel'
                title={project_title}>
            <Paper class="mb-64">

                <PaperHeader>
                    <Breadcrumb class="mt-1 mb-5" path={context_item.GetCanonicalPath}/>
                </PaperHeader>

                <figure>
                    <h1><Editable self={context_item} a='Title'/></h1>
                    <figcaption><Editable self={context_item} a='Summary'/></figcaption>
                </figure>

                <List   self={context_item}
                        a={list_assoc_name}
                        {list_properties}
                        toolbarOperations={get_list_operations}
                        orderAttrib='Order'

                        bind:this={lists_component}>

                    <ListInserter action={add_list} icon/>
                </List>

                <hr/>

                <List   self={context_item}
                        a='all_folder_elements'
                        {list_properties}
                        toolbarOperations={get_folder_operations}
                        orderAttrib='Order'

                        bind:this={folder_component}>

                    <ListInserter action={add_folder_element} icon/>
                </List>

                <input hidden type="file" id="attachementFile" accept="*/*" bind:this={att_input_element} on:change={on_attachement_selected}/>

            </Paper>
        </Page>
    {/key}
{:else}
    {#if failed_message}
        <Paper>
            <PaperHeader></PaperHeader>
            <h3>_; Error; Error; Błąd</h3>
            <p>{failed_message}</p>
        </Paper>
        
    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}



<Modal title={i18n(['Uploading...', 'Carga...', 'Przesyłanie...'])}
    bind:open={pending_uploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={500}/>
    <span class="ml-3">_; Your file is uploading to the server; Tu archivo se está cargando en el servidor; Twój plik jest przesyłany na serwer</span>
</Modal>