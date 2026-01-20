<script>
    import {    Spinner,
                PaperNav,
                SidebarGroup,
                SidebarList,
                SidebarItem,
                onErrorShowAlert,
                UI,
                registerKicksObserver,
			unregisterKicksObserver, i18n, ext} from '$lib'
    import {location} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let generalChannels = [];
    let directChannels = [];

    let navGeneralLists;
    let navGeneralItems = [];

    let navDirectLists;
    let navDirectItems = [];

    $: currentPath = $location;

    const navRefresher = {
        refresh: () => {
                refreshNavigator();
            }
    }

    let kickObserverId = 0
    onMount( () =>
    {
        initNavigator();
        UI.navigator = navRefresher

        return () => {
            if(kickObserverId > 0)
                unregisterKicksObserver(kickObserverId)
            if(UI.navigator == navRefresher)
                UI.navigator = null
        }
    })



    async function initNavigator()
    {
        if(kickObserverId > 0)
            unregisterKicksObserver(kickObserverId)

        readyPartsNo = 0

        const generalKey = `navigatorGeneralChannels`
        const generalValue = cache.get(generalKey)
        if(generalValue)
        {
            generalChannels = generalValue;
            navGeneralLists?.reload(generalChannels)
        }

        fetchGeneralChannels().then(() =>
        {
            navGeneralLists?.reload(generalChannels)
            cache.set(generalKey, generalChannels);
            registerKicksObserverWhenReady()
        })


        const directKey = `navigatorDirectChannels`
        const directValue = cache.get(directKey)
        if(directValue)
        {
            directChannels = directValue;
            navDirectLists?.reload(directChannels)
        }

        fetchDirectChannels().then(() =>
        {
            navDirectLists?.reload(directChannels)
            cache.set(directKey, directChannels);
            registerKicksObserverWhenReady()
        })

    }

    let readyPartsNo = 0
    function registerKicksObserverWhenReady()
    {
        readyPartsNo++;
        if(readyPartsNo < 2)
            return

        let labels = []
        generalChannels.filter(ch => !!ch.IsSubscribed).forEach( ch => labels.push(`MsgC_${ch.Id}`))
        directChannels.forEach(ch => labels.push(`MsgC_${ch.MessageChannelId}`))

        if(labels.length > 0)
            kickObserverId = registerKicksObserver(labels, 60, labels => refreshNavigator())
    }

    function refreshNavigator()
    {
        const generalKey = `navigatorGeneralChannels`
        fetchGeneralChannels().then(() =>
        {
            navGeneralLists?.reload(generalChannels)
            cache.set(generalKey, generalChannels);
        })


        const directKey = `navigatorDirectChannels`

        fetchDirectChannels().then(() =>
        {
            navDirectLists?.reload(directChannels)
            cache.set(directKey, directChannels);
        })
    }

    function fetchGeneralChannels()
    {
        return reef.get("/group/MessageChannels?sort=Order&fields=$ref,Id,Title,Summary,Order,href,icon,$type,GetUnreadMessagesNo,IsSubscribed", onErrorShowAlert).then((res) =>
        {
            if(res != null)
                generalChannels = res.MessageChannel;
            else
                generalChannels = [];
        })
    }

    function fetchDirectChannels()
    {
        return reef.get("/user/MessageChannels?sort=Order&fields=$ref,Id,Title,Summary,Order,href,icon,$type,UnreadMessagesNo,MessageChannelId", onErrorShowAlert).then((res) =>
        {
            if(res != null)
                directChannels = res.MessageChannelUser;
            else
                directChannels = [];
        })
    }

    async function reloadGeneralChannels()
    {
        await fetchGeneralChannels();
        navGeneralLists.reload(generalChannels)
    }

    async function reloadDirectChannels()
    {
        await fetchDirectChannels();
        navDirectLists.reload(directChannels)
    }

    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        if(linkPath.startsWith('#'))
            linkPath = linkPath.substring(1)

        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }

</script>

{#key currentPath}
<PaperNav>

    {@const hasContent = (generalChannels ) || (directChannels )}
    {#if hasContent}

            <SidebarGroup title={i18n({en: 'Common', es: 'Comunes', pl: 'Wspólne'})}
                        moreHref="/general-channels">

                <SidebarList    objects={generalChannels}
                                orderAttrib='Order'
                                bind:this={navGeneralLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={item.icon}
                                        bind:this={navGeneralItems[idx]}
                                        active={isRoutingTo(href, currentPath)}
                                        >
                            <span class="relative">
                                 {#if item.GetUnreadMessagesNo}
                                    <div class="absolute
                                            inline-flex items-center justify-center
                                            w-5 h-5
                                            text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-5 dark:border-gray-900">
                                        {#if item.UnreadMessagesNo <= 9}
                                            {item.UnreadMessagesNo}
                                        {:else}
                                            9+
                                        {/if}
                                    </div>
                                {/if}
                                {ext(item.Title)}
                            </span>
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>
            </SidebarGroup>



            <SidebarGroup title={i18n({en: 'Private', es: 'Privados', pl: 'Prywatne'})}
                        moreHref="/private-channels">

                <SidebarList    objects={directChannels}
                                orderAttrib='Order'
                                bind:this={navDirectLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={item.icon}
                                        bind:this={navDirectItems[idx]}
                                        active={isRoutingTo(href, currentPath)}
                                        >
                            <span class="relative">
                                {ext(item.Title)}
                                {#if item.UnreadMessagesNo}
                                    <div class="absolute
                                            inline-flex items-center justify-center
                                            w-5 h-5
                                            text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-5 dark:border-gray-900">
                                        {#if item.UnreadMessagesNo <= 9}
                                            {item.UnreadMessagesNo}
                                        {:else}
                                            9+
                                        {/if}
                                    </div>
                                {/if}
                            </span>
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList>

                <!--button   class=" mb-2 ml-2 mr-3 w-full
                    text-base font-normal
                    text-stone-500 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-400
                    flex items-center"
                    on:click={onNewDMChannel}
                    >
                    <Icon component={FaPlus} class="inline-block w-4 h-4 mt-0.5 ml-2.5 pr-0.5 mr-4"/>
                    <p>_; New direct channel; Nuevo canal directo; Nowy kanał bezpośredni</p>
                </button-->

            </SidebarGroup>


    {:else}
        <Spinner delay={3000}/>
    {/if}

</PaperNav>
{/key}
