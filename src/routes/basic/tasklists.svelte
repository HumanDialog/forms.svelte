<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                Editable,
                focusEditable,
                onErrorShowAlert, Breadcrumb, Paper, PaperHeader,
                i18n, ext, reloadPageToolbarOperations,
                query_item_collection, showMenu, Ricon
        } from '$lib'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaList, FaPen, FaArchive, FaChevronLeft, FaChevronRight} from 'svelte-icons/fa'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'
    import { STATUS_ACTIVE, STATUS_ARCHIVED, STATUS_DELETED } from './consts';

    export let params = {}

    let self = null;
    let context = null;
    let listComponent;

    let showArchived = false;
    let contextItemSelector;
    let self_ref;
    let collection_ref;

    let cacheKey;
    let contextPath;
    let contextItemId;
    let canonicalPath = []

    let query_selector = "";
    let query_id = 0;

    let title = "";

    $: onParamsChanged($location, $session, $mainContentPageReloader, $querystring);


    const separator_op = () => {
        return { separator: true }
    }

    const separator_A_op = () => {
        return { separator: true, tbr: 'A' }
    }

    let new_element_creator = null

    const new_list_op = (after=null) => {
        return {
            mricon: 'notebook',
            caption: '_; New list; Nueva lista; Nowa lista',
            action: (btt, rect) => create_new_list_from_template(after, btt, rect),
            //action: () => { new_element_creator=new_list_creator; listComponent.addRowAfter(after) },
            fab: 'M01',
            tbr: 'A'
        }
    }


    const new_list_creator = async (attribs) => {
        
        const res = await reef.post(`${self.$ref}/CreateList`,
                            {
                                name: attribs.Name,
                                order: attribs.Order,
                                summary: attribs.Summary
                            });
        if(!res)
            return null;
        else
            return res.TaskList;
    } 

    const new_list_from_template_op = (after=null) => {
        return {
            //mricon: 'notebook',
            caption: '_; New list from a template; Nueva lista a partir de una plantilla; Nowa lista ze wzorca',
            action: (btt, rect) => create_new_list_from_template(after, btt, rect)
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
                        const new_list_order = listComponent.assignOrder(after)
                        const res = await reef.post(`${self.$ref}/CreateListFromTemplate`, {
                                        template: t.$ref,
                                        order: new_list_order})
                        if(res)
                        {
                            const new_list = res.TaskList
                            await reloadLists(new_list.$ref)
                        }
                    }
                })
            })
        }

        if(!rect)
            rect = btt.getBoundingClientRect()
        showMenu(rect, templates_menu)
    }

    const new_template_list_op = (list=null) => {
        return {
            mricon: 'notebook',
            caption: '_; New template; Nueva plantilla; Nowy szablon',
            action: () => { new_element_creator=new_template_list_creator; listComponent.addRowAfter(list) },
            fab: 'M01',
            tbr: 'A'
        }
    }


    const new_template_list_creator = async (attribs) => {
        
        const res = await reef.post(`${self.$ref}/CreateTemplateList`,
                            {
                                name: attribs.Name,
                                order: attribs.Order,
                                summary: attribs.Summary
                            });
        if(!res)
            return null;
        else
            return res.TaskList;
    } 

    const edit_list_op = (list) => {
        return {
                    caption: '_; Edit...; Editar...; Edytuj...',
                    mricon: 'pencil',
                    fab: 'M20',
                    tbr: 'A',
                    grid: [
                            {
                                caption: '_; Title; Título; Tytuł',
                                action: () =>  { listComponent.edit(list, 'Name') }
                            },
                            {
                                caption: '_; Summary; Resumen; Podsumowanie',
                                action: () =>  { listComponent.edit(list, 'Summary') }
                            }
                    ]
                }
    }

    const move_top_op = (list) => {
        return {
                    caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                    hideToolbarCaption: true,
                    mricon: 'chevrons-up',
                    action: () => listComponent.moveTop(list),
                    fab: 'M06',
                    tbr: 'A'
        }
    }

    const move_up_op = (list) => {
        return {
                    caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                    hideToolbarCaption: true,
                    mricon: 'chevron-up',
                    action: () => listComponent.moveUp(list),
                    fab: 'M05',
                    tbr: 'A'
        }
    }

    const move_down_op = (list) => {
        return {
                    caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                    hideToolbarCaption: true,
                    mricon: 'chevron-down',
                    action: (f) => listComponent.moveDown(list),
                    fab: 'M04',
                    tbr: 'A'
        }
    }

    const move_top_up_down = [move_top_op, move_up_op, move_down_op]

    async function toggle_subscribe(list)
        {
            if(list.IsSubscribed)
            {
                const res = await reef.get(`${list.$ref}/Unsubscribe`)
                if(res)
                    list.IsSubscribed = false
            }
            else
            {
                const res = await reef.get(`${list.$ref}/Subscribe`)
                if(res)
                    list.IsSubscribed = true
            }

            listComponent.reloadSelectionOperations()
        }


    const subscribe_list_op = (list) => {
        return {
                caption: list.IsSubscribed ? '_; Unfollow; Dejar de seguir; Przestań obserwować' : '_; Follow; Seguir; Obserwuj',
                mricon: list.IsSubscribed ? 'heart-off' : 'heart',
                tbr: 'C',
                fab: 'S20',
                hideToolbarCaption: true,
                action: () => toggle_subscribe(list)
            }
    }

    

    const save_list_as_template_op = (list) => {
        return {
            caption: '_; Save as a template; Guardar como plantilla; Zapisz jako szablon',
            action: () => save_list_as_template(list)
        }
    }

    async function save_list_as_template(list)
    {
        if(!list)
            return;

        const href = await reef.get(`${list.$ref}/SaveAsTemplate`)
        if(href)
            push(href)
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

    const show_my_lists_from_archive_op = () => show_active_elements('notebook', '/mylists', 'S02')
    const show_my_lists_from_trash_op = () => show_active_elements('notebook', '/mylists', 'S01')

    const show_my_archived_lists_op = () => {
        return show_archived_elements('/myarchivedlists')
    }

    const show_my_deleted_lists_op = () => {
        return show_deleted_elements('/mydeletedlists')
    }

    const show_group_lists_from_archive_op = () => show_active_elements('notebook', '/alllists', 'S02')
    const show_group_lists_from_trash_op = () => show_active_elements('notebook', '/alllists', 'S01')

    const show_group_archived_lists_op = () => {
        return show_archived_elements('/archivedlists')
    }

    const show_group_deleted_lists_op = () => {
        return show_deleted_elements('/deletedlists')
    }


    const restore_from_archive_op = (list) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_from_archive(list),
        }
    }

    const restore_from_trash_op = (list) => {
        return {
            caption: '_; Restore; Restaurar; Przywróć',
            mricon: 'undo',
            tbr: 'B',
            fab: 'M20',
            action: () => restore_from_trash(list),
        }
    }

    const empty_lists_trash_op = (list) => {
        return {
            caption: '_; Empty the trash; Vacía la papelera; Opróżnij kosz',
            action: () => empty_lists_trash(),
            tbr: 'A',
            fab: 'S00',
            mricon: 'brush-cleaning',
        }
    }

    async function restore_from_archive(list)
    {
        await reef.get(`${list.$ref}/RestoreFromArchive`);
        await reloadLists(listComponent.SELECT_NEXT)
    }

    async function restore_from_trash(list)
    {
        await reef.get(`${list.$ref}/RestoreFromTrash`);
        await reloadLists(listComponent.SELECT_NEXT)
    }

    async function empty_lists_trash()
    {
        await reef.get(`${self.$ref}/EmptyListsTrash`);
        await reloadLists(listComponent.CLEAR_SELECTION)
    }




    const new_project_op = (after=null) => {
        return {
            mricon: 'building',
            caption: '_; New project; Nuevo proyecto; Nowy projekt',
            action: () => { new_element_creator=new_project_creator; listComponent.addRowAfter(after) },
            fab: 'M01',
            tbr: 'A'
        }
    }

    const new_project_creator = async (attribs) => {
        const res = await reef.post('/group/CreateProject',
                            {
                                title: attribs.Title,
                                order: attribs.Order,
                                summary: attribs.Summary
                            });
        if(!res)
            return null;
        else
            return res.Project;
    } 

    const edit_project_op = (list) => {
        return {
                    caption: '_; Edit...; Editar...; Edytuj...',
                    mricon: 'pencil',
                    fab: 'M20',
                    tbr: 'A',
                    grid: [
                            {
                                caption: '_; Title; Título; Tytuł',
                                action: () =>  { listComponent.edit(list, 'Title') }
                            },
                            {
                                caption: '_; Summary; Resumen; Podsumowanie',
                                action: () =>  { listComponent.edit(list, 'Summary') }
                            }
                    ]
                }
    }

    const move_project_to_archive_op = (list) => {
        return {
                caption: '_; Archive project; Archivar proyecto; Archiwizuj projekt',
                action: () => move_me_to_archive(),
                disabledFunc: () => self ? self.Status != STATUS_ACTIVE : false
        }
    }


    const move_project_to_trash_op = (list) => {
        return {
                caption: '_; Delete project; Eliminar proyecto; Usuń projekt',
                action: () => move_me_to_trash(),
                disabledFunc: () => self ? self.Status == STATUS_DELETED : false
        }
    }

    async function move_me_to_archive()
    {
        if(!self)
            return;

        await reef.get(`${self.$ref}/MoveMeToArchive`)   
        await reloadLists(listComponent.SELECT_NEXT)
    }

    async function move_me_to_trash()
    {
        if(!self)
            return;

        await reef.get(`${self.$ref}/MoveMeToTrash`)
        await reloadLists(listComponent.SELECT_NEXT)
    }

    const show_active_projects_from_archive_op = () => show_active_elements('building', '/allprojects', 'S02')
    const show_active_projects_from_trash_op = () => show_active_elements('building', '/allprojects', 'S01')

    const show_archived_projects_op = () => {
        return show_archived_elements('/archivedprojects')
    }

    const show_deleted_projects_op = () => {
        return show_deleted_elements('/deletedprojects')
    }

    const empty_projects_trash_op = (list) => {
        return {
            caption: '_; Empty the trash; Vacía la papelera; Opróżnij kosz',
            action: () => empty_projects_trash(),
            tbr: 'A',
            fab: 'S00',
            mricon: 'brush-cleaning'
        }
    }

    async function empty_projects_trash()
    {
        await reef.get(`${self.$ref}/EmptyProjectsTrash`);
        await reloadLists(listComponent.CLEAR_SELECTION)
    }

    const show_project_active_lists_from_archive_op = () => show_active_elements('notebook', `/project/${self.Id}`, 'S02')
    const show_project_active_lists_from_trash_op = () => show_active_elements('notebook', `/project/${self.Id}`, 'S01')
    
    
    const show_project_archived_lists_op = () => {
        return show_archived_elements(`/projectarchive/${self.Id}`)
    }

    const show_project_deleted_lists_op = () => {
        return show_deleted_elements(`/projecttrash/${self.Id}`)
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
        await reef.get(`${self.$ref}/EmptyTrash`);
        await reloadLists(listComponent.CLEAR_SELECTION)
    }

    const edit_page_op = () => {
        return {
                    caption: '_; Edit; Editar; Edytuj',
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

    const group_expressions = ['Id', '$type', '$ref', 'Name'];
    const user_expressions = ['Id', '$type', '$ref', 'Name'];
    const project_expressions = ['Id','$type', '$ref', 'Title', 'Summary', 'Order', 'Status', 'href', '$ver'];
    const task_list_expressions = ['Id', '$type', 'Name', 'Summary', 'Order', 'href', '$ref', 'IsSubscribed', '$ver'];

    const task_lists_grid_definition = {
        element:{
            icon: "#notebook",
            Title: "Name",
            Summary: "Summary",
            href: "href",
        }      
    }

    const projects_grid_definition = {
        element:{
            icon: "#building",
            Title: "Title",
            Summary: "Summary",
            href: "href",
        }
    }

    const query_params = {

        contexts: {
            default:{
                title: '__; en: Common lists; es: Listas comunes; pl: Wspólne listy',
                summary: "__;en: Task lists visible to all group members;es: Listas de tareas visibles para todos los miembros del grupo.;pl: Listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions,
                list_properties: task_lists_grid_definition
            },
            alllists: {
                title: '__; en: Common lists; es: Listas comunes; pl: Wspólne listy',
                summary: "__;en: Task lists visible to all group members;es: Listas de tareas visibles para todos los miembros del grupo.;pl: Listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        view: [show_group_archived_lists_op, show_group_deleted_lists_op]
                    },
                    element:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        file: [edit_list_op, move_top_op, move_up_op, move_down_op],
                        view: [show_group_archived_lists_op, show_group_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            archivedlists:{
                title: '__; en: Archived lists; es: Listas comunes; pl: Zarchiwizowane listy',
                summary: "__;en: Archived lists visible to all group members;es: Listas comunes de tareas visibles para todos los miembros del grupo.;pl: Zarchiwizowane listy zadań widoczne dla wszystkich członków grupy.",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "ArchivedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [show_group_lists_from_archive_op, show_group_deleted_lists_op]
                    },
                    element:{
                        file: [restore_from_archive_op],
                        view: [show_group_lists_from_archive_op, show_group_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            deletedlists:{
                title: '__; en: Deleted lists; es: Listas eliminadas; pl: Usunięte listy',
                summary: "__;en: Deleted lists visible to all group members; es: Listas eliminadas visibles para todos los miembros del grupo; pl: Usunięte listy widoczne dla wszystkich członków grupy",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "DeletedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [empty_lists_trash_op, show_group_archived_lists_op, show_group_lists_from_trash_op]
                    },
                    element:{
                        file: [restore_from_trash_op],
                        view: [empty_lists_trash_op, show_group_archived_lists_op, show_group_lists_from_trash_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            mylists:{
                title: '__; en: My lists; es: Mis listas; pl: Moje listy',
                summary: "__;en: Task lists visible only to me; es: Listas de tareas visibles solo para mí; pl: Listy zadań widoczne tylko dla mnie",
                self: "user",
                self_type: 'User',
                self_expressions: user_expressions,
                collection: "MyLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        view: [show_my_archived_lists_op, show_my_deleted_lists_op]
                    },
                    element:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        file: [edit_list_op, move_top_op, move_up_op, move_down_op],
                        view: [show_my_archived_lists_op, show_my_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            myarchivedlists:{
                title: '__; en: My archived lists; es: Mis listas archivadas; pl: Moje zarchiwizowane listy',
                summary: "__;en: Archived lists visible to me; es: Listas archivadas que puedo ver; pl: Archiwalne listy widoczne dla mnie",
                self: "user",
                self_type: 'User',
                self_expressions: user_expressions,
                collection: "ArchivedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [show_my_lists_from_archive_op, show_my_deleted_lists_op]
                    },
                    element:{
                        file: [restore_from_archive_op],
                        view: [show_my_lists_from_archive_op, show_my_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            mydeletedlists:{
                title: '__; en: My deleted lists; es: Mis listas eliminadas; pl: Moje usunięte listy',
                summary: "__;en: Deleted lists visible to me; es: Listas eliminadas que puedo ver; pl: Usunięte listy widoczne dla mnie",
                self: "user",
                self_type: 'User',
                self_expressions: user_expressions,
                collection: "DeletedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [empty_lists_trash_op, show_my_archived_lists_op, show_my_lists_from_trash_op]
                    },
                    element:{
                        file: [restore_from_trash_op],
                        view: [empty_lists_trash_op, show_my_archived_lists_op, show_my_lists_from_trash_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            listtemplates:{
                title: '__; en: List templates; es: Plantillas de listas; pl: Szablony list',
                summary: '__; en: All saved list templates; es: Todas las plantillas de listas guardadas; pl: Wszystkie zapisane szablony list',
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "ListTemplates",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        new: [new_template_list_op],
                        view: [show_group_archived_lists_op, show_group_deleted_lists_op]
                    },
                    element:{
                        new: [new_template_list_op],
                        file: [edit_list_op, move_top_op, move_up_op, move_down_op],
                        view: [show_group_archived_lists_op, show_group_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition
            },
            allprojects:{
                title: '__; en: Active projects; es: Proyectos en curso; pl: Aktywne projekty',
                summary: "__;en: All active projects visible to all group members;es: Todos los proyectos activos visibles para todos los miembros del grupo;pl: Wszystkie aktywne projekty widoczne dla wszystkich członków grupy",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "Projects",
                element_expressions: project_expressions,
                operations:{
                    page:{
                        new: [new_project_op],
                        view: [show_archived_projects_op, show_deleted_projects_op]
                    },
                    element:{
                        new: [new_project_op],
                        file: [edit_project_op, move_top_op, move_up_op, move_down_op],
                        view: [show_archived_projects_op, show_deleted_projects_op]
                    }
                },
                list_properties: projects_grid_definition
            },
            archivedprojects:{
                title: '__; en: Archived projects; es: Proyectos archivados; pl: Zarchiwizowane projekty',
                summary: "__;en: Archived projects visible to all group members;es: Proyectos archivados visibles para todos los miembros del grupo;pl: Zarchiwizowane projekty widoczne dla wszystkich członków grupy",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "ArchivedProjects",
                element_expressions: project_expressions,
                operations:{
                    page:{
                        view: [show_active_projects_from_archive_op, show_deleted_projects_op]
                    },
                    element:{
                        file: [restore_from_archive_op],
                        view: [show_active_projects_from_archive_op, show_deleted_projects_op]
                    }
                },
                list_properties: projects_grid_definition
            },
            deletedprojects:{
                title: '__; en: Deleted projects; es: Proyectos eliminados; pl: Usunięte projekty',
                summary: "__;en: Deleted projects visible to all group members; es: Los proyectos eliminados son visibles para todos los miembros del grupo; pl: Usunięte projekty widoczne dla wszystkich członków grupy",
                self: "group",
                self_type: 'Group',
                self_expressions: group_expressions,
                collection: "DeletedProjects",
                element_expressions: project_expressions,
                operations:{
                    page:{
                        view: [empty_projects_trash_op, show_archived_projects_op, show_active_projects_from_trash_op]
                    },
                    element:{
                        file: [restore_from_trash_op],
                        view: [empty_projects_trash_op, show_archived_projects_op, show_active_projects_from_trash_op]
                    }
                },
                list_properties: projects_grid_definition
            },
            project:{
                stitle: 'Title',
                ssummary: 'Summary',
                self: "Project", use_id: true,
                self_type: 'Project',
                self_expressions: project_expressions,
                collection: "Lists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        view: [edit_page_op, move_project_to_archive_op, move_project_to_trash_op, show_project_archived_lists_op, show_project_deleted_lists_op]
                    },
                    element:{
                        new: [new_list_op/*, new_list_from_template_op*/],
                        file: [edit_list_op, move_top_op, move_up_op, move_down_op],
                        view: [move_project_to_archive_op, move_project_to_trash_op, show_project_archived_lists_op, show_project_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition,
                supplementary: {
                    a: {
                        path: '/folder/project',
                        use_id: true,
                        href: '',
                        caption: '__; en: Show project folder; es: Mostrar la carpeta del proyecto; pl: Pokaż folder projektu'
                    }
                }
            },
            projecttrash: {
                title: '__; en: Project trash; es: Basura del proyecto; pl: Kosz projektu',
                summary: '__; en: Here you will find all deleted project items; es: Aquí encontrarás todos los elementos del proyecto que se han eliminado; pl: Tutaj znajdziesz wszystkie usunięte elementy projektu',
                self: "Project", use_id: true,
                self_type: 'Project',
                self_expressions: project_expressions,
                collection: "DeletedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [empty_project_trash_op, show_project_archived_lists_op, show_project_active_lists_from_trash_op]
                    },
                    element:{
                        file: [restore_from_trash_op],
                        view: [empty_project_trash_op, show_project_archived_lists_op, show_project_active_lists_from_trash_op]
                    },
                },
                list_properties: task_lists_grid_definition,
                supplementary: {
                    a: {
                        path: '/folder/projecttrash',
                        use_id: true,
                        href: '',
                        caption: '__; en: Show project trash; es: Mostrar la papelera del proyecto; pl: Pokaż kosz projektu'
                    }
                }
            },
            projectarchive: {
                title: '__; en: Project archive; es: Archivo del proyecto; pl: Archiwum projektu',
                summary: '__; en: Here you will find all archived project items; es: Aquí encontrarás todos los elementos archivados del proyecto; pl: Tu znajdziesz wszystkie zarchiwizowane elementu projektu',
                self: "Project", use_id: true,
                self_type: 'Project',
                self_expressions: project_expressions,
                collection: "ArchivedLists",
                element_expressions: task_list_expressions,
                operations:{
                    page:{
                        view: [show_project_active_lists_from_archive_op, show_project_deleted_lists_op]
                    },
                    element:{
                        file: [restore_from_archive_op],
                        view: [show_project_active_lists_from_archive_op, show_project_deleted_lists_op]
                    }
                },
                list_properties: task_lists_grid_definition,
                supplementary: {
                    a: {
                        path: '/folder/projectarchive',
                        use_id: true,
                        href: '',
                        caption: '__; en: Show project archive; es: Mostrar el archivo del proyecto; pl: Pokaż archiwum projektu'
                    }
                }
            }
        }
    }

    let query_root = "";
    let query_key = "";


    let query_body = {}

    function select_context()
    {
        const segments = $location.split('/');

        if(!segments.length)
            query_selector = 'default'
        else
            query_selector = segments[1];

        context = query_params.contexts[query_selector];
        if(!context)
        {
            query_selector = 'default'
            context = query_params.contexts[query_selector];
            return;
        }

        if(!context.use_id)
            return;

        if(segments.length > 2)
            query_id = parseInt(segments[2]);

        if(query_id <= 0)
        {
            query_selector = 'default'
            context = query_params.contexts[query_selector];
        }
    }

    function adjust_query_root()
    {
        let self = context.self;

        if(!context.use_id)
            query_root = "/" + context.self + "/query";
        else
            query_root = "/" + context.self + "/" + query_id + "/query";

    }

    function adjust_query_body()
    {

        query_body = query_item_collection( context.self_expressions,
                                                context.collection,
                                                context.element_expressions);

    }

    function adjust_query_key()
    {
        query_key = context.self + "/" + context.collection;
    }

    function adjust_other_params()
    {
        title = context.title;

        if(context.supplementary && context.supplementary.a)
        {
            const a = context.supplementary.a
            if(a.path && a.use_id)
                a.href = a.path + '/' + query_id
        }
    }

    function apply_params_after_fetch()
    {
        if(context.stitle)
            title = self[context.stitle]
    
    }


    async function onParamsChanged(...args)
    {
        select_context()

        adjust_query_root();
        adjust_query_body();
        adjust_query_key();
        adjust_other_params();




        //const cachedValue = cache.get(query_key)
        //if(cachedValue)
        //{
        //    contextItem = cachedValue;
        //    folderTitle = ext(contextItem.Title);
        //    contextItemId = cachedValue.Id;
        //    listComponent?.reload(contextItem, listComponent.KEEP_SELECTION)
        // }
        //---------------------------------------------------
        //const readItem = await readContextItem(self_ref, cacheKey)

        await fetch_items()

        apply_params_after_fetch()
    }

    async function fetch_items()
    {
        let res = await reef.post(query_root,
                                query_body,
                                onErrorShowAlert);
        if(res)
            self = res[context.self_type];
        else
            self = null

    }

    async function reloadLists(selectRecommendation)
    {
        await fetch_items();
        listComponent.reload(self, selectRecommendation);
    }


    let deleteModal;
    let listToDelete;
    function askToDelete(list)
    {
        listToDelete = list;
        deleteModal.show()
    }


    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/group/Lists/${listToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();


        await reloadLists(listComponent.SELECT_NEXT)
    }

    async function addList(newListAttribs)
    {
        let newElement
        if(!new_element_creator)
            return null;

        newElement = await new_element_creator(newListAttribs)
        if(!newElement)
            return null;

        await reloadLists(newElement.$ref)
    }

    function get_page_operations()
    {
        if(context && context.operations && context.operations.page)
            return compose_operations(context.operations.page)
        else
            return []
    }

    function get_element_operations(selectedElement)
    {
        if(context && context.operations && context.operations.element)
            return compose_operations(context.operations.element, selectedElement)
        else
            return []
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


</script>

<svelte:head>
    <title>{ext(title)} | {__APP_TITLE__}</title>
</svelte:head>

{#if self}
    {#key self}

        <Page   self={self}
                toolbarOperations={get_page_operations()}
                clearsContext='props sel'
                title={title}>
            <Paper class="mb-64">

            <PaperHeader>
                <!--Breadcrumb class="mt-1 mb-5" path={canonicalPath}/-->
            </PaperHeader>
            <!--
            {#if true}
                <h1><Editable self={contextItem} a='Title'/></h1>

                <p class="lead">
                    <Editable self={contextItem} a='Summary'/>
                </p>

            {:else}
                <h1>
                    {ext(contextItem.Title)}
                </h1>
                {#if contextItem.Summary}
                    <p class="lead">
                        {ext(contextItem.Summary)}
                    </p>
                {/if}
            {/if}-->

            <figure>
                    {#if context.title}
            <h1>{ext(context.title)}</h1>
                    {:else if context.stitle}
            <h1><Editable self={self} a={context.stitle}/></h1>
                    {/if}

                    {#if context.summary}
            <figcaption>{ext(context.summary)}</figcaption>
                    {:else if context.ssummary}
            <figcaption><Editable self={self} a={context.ssummary}/></figcaption>
                    {/if}

            </figure>

            <List   self={self}
                    a={context.collection}
                    list_properties={context.list_properties}
                    toolbarOperations={get_element_operations}
                    orderAttrib='Order'

                    bind:this={listComponent}>

                <ListInserter action={addList} icon/>



            </List>

            {#if context && context.supplementary && context.supplementary.a}
                <p class="mt-20 mb-10">
                    <a href={context.supplementary.a.href} use:link>
                        {ext(context.supplementary.a.caption)}
                        <div class="inline-block w-4 h-4 ml-0 align-baseline"><Ricon icon='chevron-right' s /></div>
                    </a>
                </p>
            {/if}

            </Paper>
        </Page>
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected list?", "¿Está seguro de que desea eliminar la list seleccionada?", "Czy na pewno chcesz usunąć wybraną listę?"])}
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

