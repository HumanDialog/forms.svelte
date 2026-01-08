<script>
    import {reef, session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
	import {Layout, onErrorShowAlert, Spinner, i18n, Console, registerKicksObserver, unregisterKicksObserver,
        getGroupsMenu
    } from '$lib';
    import Sidebar from './sidebar.svelte'

    import SidebarFolders from './sidebar.folders.svelte'
    import SidebarMessages from './sidebar.messages.svelte'
    import SidebarTilos from './sidebar.tilos.svelte'

    import {push, querystring, location} from 'svelte-spa-router'

    import AppIcon from './appicon.svelte'
    import TilosIcon from './icons/tilos.icon.svelte'

    import FaFolder from 'svelte-icons/fa/FaFolder.svelte'
    import {FaUsersCog, FaSignOutAlt, FaList, FaComments, FaUser, FaPaste} from 'svelte-icons/fa/'

    import Tasklist from './tasklist.svelte';
    import Folder from './folder.svelte';
    import Task from './task.svelte'
    import Note from './note.svelte'
    import Board from './list.board.svelte';
    import DesignGT from './design.general.typography.svelte';
    import DesignLists from './design.general.lists.svelte';
    import DesignTypoLists from './design.general.typolists.svelte';
    import DesignNavs from './design.general.navlists.svelte';
    import MyTasks from './mytasks.svelte'
    import MyFolders from './myfolders.svelte'
    import Chat from './chat.svelte'
    import Members from './members.svelte'
    import AppMain from './AppMain.svelte'
    import Thread from './thread.svelte'
    import NewThread from './thread.new.svelte'
    import Forum from './forum.svelte'
    import RequestLicenseFile from './request.license.svelte'
    import TilosHome from './tilos/dashboard.svelte'
    import Profile from './profile.svelte'
    import TilosDownload from './tilos/download.svelte'
    import TilosContact from './tilos/contact.svelte'
    import Unauthorized from './tilos/unauthorized.access.svelte';
    import AllTaskLists from './tasklists.all.svelte'
    import MyTaskLists from './tasklists.my.svelte'
    import GroupFolders from './folders.group.svelte'
    import GeneralChannels from './channels.general.svelte'
    import PrivateChannels from './channels.private.svelte'
    import MyNotes from './notes.my.svelte'
    import MyDay from './dashboard.myday.svelte'
    import TeamDay from './dashboard.teamday.svelte'
    //import StaticDoc from './tilos/static.doc.svelte'

    import { tick, onMount } from 'svelte';

    const objectreef_io = __OBJECTREEF_IO__
    const appId = __APP_ID__
    const tenantId = __TENANT_ID__
    const proto = __SERVICE_PROTOCOL__
    const octopus_modules = __OCTOPUS_MODULES__

    let layout = null

    $: init($session)

    async function init(...args)
    {
        if(!$session.isActive && !$session.isUnauthorizedGuest)
        {
            const hasStaticContent = canShowStaticContent(octopus_modules)
            if(!hasStaticContent)
            {
                await tick();
                reef.redirectToSignIn();
            }
            else
            {
                layout = defineStaticLayout()
            }
        }
        else
        {
            if($session.isUnauthorizedGuest)
            {
                const hasPublicData = await configurePublicSession();
                if(hasPublicData)
                    layout = defineGuestLayout()
                else
                    layout = null
            }
            else if($session.isActive)
            {
                const groupsMenu = await getGroupsMenu({
                    session: $session,
                    redirectAfterSwitch: __APP_DEFAULT_PAGE__,
                    afterGroupCreated: afterGroupCreated
                })

                layout = defineAuthorizedLayout(groupsMenu)
            }
        }

    }

    function afterGroupCreated()
    {
        init($session)
    }


    function defineModuleNavigator(module, showStaticOnly=false)
    {
        if(!showStaticOnly)
        {
            switch(module)
            {
            case 'tasklists':
                return {
                    'TOC':{
                        icon: FaList,
                        component: Sidebar
                    }
                }

            case 'folders':
                return {
                    'Folders': {
                        icon: FaFolder,
                        component: SidebarFolders
                    }
                }

            case 'messages':
                return {
                    'Messages': {
                            icon: FaComments,
                            component: SidebarMessages,
                            mountObserver: mountMessagesObserver,
                            badgeObtainerAsync: async () => await getUnreadMessages()
                        }
                }

            case 'tilos':
                return {
                    'Tilos': {
                            icon: TilosIcon,
                            component: SidebarTilos
                        }
                }

            default:
                return { }
            }
        }
        else
        {
            // only tilos navigator has ability to show static content without sign-in need
            switch(module)
            {
            case 'tilos':
                return {
                    'Tilos': {
                            icon: TilosIcon,
                            component: SidebarTilos
                        }
                }
            default:
                return { }
            }
        }
    }

    let kicksObserver = 0
    let rerenderTabs;
    function mountMessagesObserver(rerenderTabsCb)
    {
        rerenderTabs = rerenderTabsCb;
        let lazyFetcher = setTimeout(() => {
            lazyFetcher=0;
            fetchSubscribedChannels()}, 1000)

        return () => {

            if(lazyFetcher)
            {
                clearTimeout(lazyFetcher)
                lazyFetcher = 0
            }

            if(kicksObserver)
            {
                unregisterKicksObserver(kicksObserver)
                kicksObserver = 0
            }
        }
    }

    async function fetchSubscribedChannels()
    {
        const labels = await reef.get('user/GetSubscribedChannelsKickLabels', onErrorShowAlert)
        if(labels && Array.isArray(labels) && labels.length > 0)
            kicksObserver = registerKicksObserver(labels, 60, refreshMessagesTab)
    }

    async function getUnreadMessages()
    {
        return await reef.get('user/GetUnreadMessagesNo', onErrorShowAlert)
    }

    async function refreshMessagesTab(labels)
    {
        if(rerenderTabs)
        {
            setTimeout(() => rerenderTabs(), 4000)
        }
    }

    function canShowStaticContent(modules)
    {
        let navigators = {}
        let mods = modules.split(',')
        mods.forEach( module =>
            navigators = {...navigators, ...defineModuleNavigator(module, true)}
        )

        const staticNavigatos = Object.keys(navigators)
        return staticNavigatos.length > 0
    }

    function defineNavigators(modules, showStaticOnly=false)
    {
        let navigators = {}
        let mods = modules.split(',')
        mods.forEach( module =>
            navigators = {...navigators, ...defineModuleNavigator(module, showStaticOnly)}
        )
        return navigators
    }

    function defineAuthorizedLayout(groupsMenu)
    {
        return {
                sidebar : defineNavigators(octopus_modules),
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/nav' :        { component: AppMain},
                        '/nav/*' :      { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/note' :       { component: Note },
                        '/note/*' :     { component: Note },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board},
                        '/design' :     { component: DesignGT},
                        '/design/*' :   { component: DesignGT},
                        '/deslis' :     { component: DesignLists},
                        '/deslis/*' :   { component: DesignLists},
                        '/destlis' :     { component: DesignTypoLists},
                        '/destlis/*' :   { component: DesignTypoLists},

                        '/desnav' :     { component: DesignNavs},
                        '/desnav/*' :   { component: DesignNavs},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/folder'    :  { component: Folder },
                        '/folder/*'  :  { component: Folder },
                        '/myfolders' :  { component: MyFolders },
                        '/myfolders/*': { component: MyFolders },
                        '/members'   :  { component: Members },
                        '/chat/*':      { component: Chat },
                        '/thread/*' :   { component: Thread },
                        '/newthread/*' :{ component: NewThread },
                        '/forum/*'   :  { component: Forum },
                        '/request-license-file': {component: RequestLicenseFile},
                        '/thome':   {component : TilosHome},
                        '/profile/*':   {component: Profile},
                        '/profile':     {component: Profile},
                        '/tdownload':   {component: TilosDownload},
                        '/tcontact':    {component: TilosContact},
                        '/alllists':    {component: AllTaskLists},
                        '/mylists':     {component: MyTaskLists},
                        '/mynotes':     {component: MyNotes},
                        '/group-folders': {component: GroupFolders},
                        '/general-channels': {component: GeneralChannels},
                        '/private-channels':{component: PrivateChannels},
                        '/myday':       {component: MyDay},
                        '/teamday':     {component: TeamDay}
                    }
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                         //   caption: '_; Profile; Perfil; Profil',
                            captionFunc: () => '_; Profile; Perfil; Profil',
                            mricon: 'user',
                            action: (f) => { push('/profile')},
                            condition: () => $session.isActive
                        },
                        {
                         //   caption: '_; Profile; Perfil; Profil',
                            captionFunc: () => '_; Change group; Change group; Zmień grupę',
                            mricon: 'users',
                            menu: groupsMenu,
                            condition: () => $session.isActive
                        },
                        {
                        //    caption: '_; Members; Miembros; Członkowie',
                            captionFunc: () => '_; Members; Miembros; Członkowie',
                            mricon: 'users',
                            icon: FaUsersCog,
                            action: (f) => { push(`/members`) },
                            condition: () => $session.authAccessGroup() != 0
                        },
                      /*  {
                            captionFunc: () => '_; Clipboard; Portapapeles; Schowek',
                            icon: FaPaste,
                            action: (f) => showBasket(),
                            condition: () => $session.isActive
                        }*/
                    ]
                },
                selectionDetails:{
                    //caption: '_; Console; Consola; Konsola',
                    captionFunc: () => '_; Console; Consola; Konsola',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

        }
    }

    function defineGuestLayout()
    {
        return {
                sidebar : {
                    'TOC': {
                        icon: FaList,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board},
                        '/thome':   {component : TilosHome}
                    }
                },
                mainToolbar : {
                    customOperations:[
                        {
                        //    caption: '_; Leave guest session; Salir de la sesión de invitado; Opuść sesję gościa',
                            captionFunc: () => '_; Leave guest session; Salir de la sesión de invitado; Opuść sesję gościa',
                            icon: FaSignOutAlt,
                            action: (f) => {
                                $session.isUnauthorizedGuest = false
                                push('/');
                            }
                        }
                    ]
                },
                selectionDetails:{
                //    caption: '_; Console; Consola; Konsola',
                    captionFunc: () => '_; Console; Consola; Konsola',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                },
                autoRedirectToSignIn: false
        }
    }

    function defineStaticLayout()
    {
        return {
                sidebar : defineNavigators(octopus_modules, true),
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/request-license-file': {component: RequestLicenseFile},
                        '/thome':   {component : TilosHome},
                        '/tdownload':    {component: TilosDownload},
                        '/tcontact':    {component: TilosContact},

                        '/tasklist':    { component: Unauthorized},
                        '/tasklist/*':  { component: Unauthorized},
                        '/task' :       { component: Unauthorized },
                        '/task/*' :     { component: Unauthorized },
                        '/note' :       { component: Unauthorized },
                        '/note/*' :     { component: Unauthorized },
                        '/listboard' :  { component: Unauthorized},
                        '/listboard/*': { component: Unauthorized},
                        '/mytasks' :    { component: Unauthorized },
                        '/mytasks/*' :  { component: Unauthorized },
                        '/folder'    :  { component: Unauthorized },
                        '/folder/*'  :  { component: Unauthorized },
                        '/myfolders' :  { component: Unauthorized },
                        '/myfolders/*': { component: Unauthorized },
                        '/members'   :  { component: Unauthorized },
                        '/chat/*':      { component: Unauthorized },
                        '/thread/*' :   { component: Unauthorized },
                        '/newthread/*' :{ component: Unauthorized },
                        '/forum/*'   :  { component: Unauthorized },
                        '/profile/*':   {component: Unauthorized},
                        '/profile':     {component: Unauthorized},
                    //    '/doc':         {component: StaticDoc},
                    //    '/doc/*':       {component: StaticDoc}
                    }
                },
                mainToolbar : {
                    signin: true,
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

        }
    }

    async function configurePublicSession()
    {
        return false;
        /*
        const lastChosenTenantId = $session.lastChosenTenantId;
        let result = null;
        try {
            const res = await fetch(`${proto}://${tenantId}.${objectreef_io}/json/anyv/app/PublicGroups`, {
                                    method: 'get',
                                    headers:{
                                        'Accept':'application/json',
                                        'X-Reef-Flags': '1'
                                    }})
            if(res.ok)
            {
                result = await res.json();
            }
            else
            {
                const err = await res.text()
                console.error(err)
                onErrorShowAlert(err);
            }
        }
        catch(err)
        {
            console.error(err)
            onErrorShowAlert(err);
        }

        //$session.setCurrentTenantAPI(`${proto}://${tenantId}.${objectreef_io}/`, '')
        //const result = await reef.get(`app/PublicGroups`)
        if(result)
        {
            let groupInfos = []
            result.Group.forEach(g => {
                groupInfos.push({
                    id: `${tenantId}/${g.Id}`,
                    url: `${proto}://${tenantId}.${objectreef_io}/`,
                    name: g.Name,
                    headers: [
                        {
                            key: 'X-Reef-Group-Id',
                            value: `${g.Id}`
                        },
                        {
                            key: 'X-Reef-Flags',
                            value: '1'
                        }
                    ]
                })
            })

            if(groupInfos.length > 0)
            {
                $session.tenants = groupInfos;

                let currentTenant;

                if(lastChosenTenantId)
                {
                    currentTenant = groupInfos.find(t => t.id == lastChosenTenantId)
                    if(!currentTenant)
                        currentTenant = groupInfos[0];
                }
                else
                {
                    currentTenant = groupInfos[0];
                }

                $session.setCurrentTenantAPI(currentTenant.url, currentTenant.id)
                return true;
            }
            else
            {
                return false;
            }
        }
        else
            return false;
        */
    }

    async function showBasket()
    {
        const href = await reef.post('user/BasketFolder/href', {}, onErrorShowAlert)
        if(!href)
            return;

        push(href)
    }

    onMount( () => {

        window.addEventListener('hashchange', onNavigationChanged)
        window.addEventListener('visibilitychange', onNavigationChanged)
        return () => {
            window.removeEventListener('hashchange', onNavigationChanged)
            window.removeEventListener('visibilitychange', onNavigationChanged)
        }
    })

    function onNavigationChanged(...args)
    {
        if(!document.hidden)
        {
            const hashPosition = window.location.href.indexOf('#/')
            let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/'
            if(location.length > 1)
            {
                const state = {
                    path: location,
                    timestamp: Date.now()
                }

                window.localStorage.setItem('lastNavigation', JSON.stringify(state))
            }
        }
    }

</script>

{#if layout}
    <Layout {layout} />
{:else}
    <Spinner/>
{/if}
