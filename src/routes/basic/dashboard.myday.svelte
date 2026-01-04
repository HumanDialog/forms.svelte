<script>
    import { reef} from '@humandialog/auth.svelte';
    import { onErrorShowAlert, mainContentPageReloader, Spinner, Page,
            editable, selectable, getNiceStringDateTime, startEditing, i18n, Paper, PaperHeader,
            contextItemsStore,
			activateItem,
			isActive,
			isSelected,
            reloadVisibleTags,
			getActive

        } from '$lib';
	import { location, querystring, link, push } from 'svelte-spa-router';
    import LatestNote from './dashboard.note.svelte'
    import SubscibedList from './dashboard.list.svelte'
    import {afterUpdate} from 'svelte'
    import {cache} from './cache.js'

    let user = null
    let tasksNo = 0
    let allTags = ''
    let users = []

    let usersComboSource;
    let listElements = []

    $: onParamsChanged($mainContentPageReloader);


    async function onParamsChanged(...args)
    {
        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res;
            reloadVisibleTags()
        })

        reef.post('group/query',
                        {
                            Id: 1,
                            Name: 'Users',
                            Tree:[
                                {
                                    Id: 1,
                                    Association: 'Members/User'
                                }
                            ]
                        },
                        onErrorShowAlert
                    ).then( (res) => {
                        if(res)
                        {
                            users = res.User;
                        }
                    })


        await loadData(true)
    }

    async function loadData(useCache=false)
    {
        const cacheKey = `myday`

        if(useCache)
            showCachedDataFirst(cacheKey);

        const res = await reef.post(`user/query`, {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 5,
                            Tree: [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:['Id', '$ref', 'Name', 'Email', 'Avatar', 'Bio', '$acc'],
                                    SubTree: [
                                        {
                                            Id: 10,
                                            Association: 'SubscribedLists',
                                            Sort: "Order",
                                            Expressions: ['Id', '$ref', 'Name', 'Summary', 'href', 'LinkInfo', 'Order'],
                                            SubTree:[
                                                {
                                                    Id: 100,
                                                    Association: 'List',
                                                    SubTree:[
                                                        {
                                                            Id: 1000,
                                                            Association: 'Tasks',
                                                            Filter: 'Actor=user and State>=3900 and State<6500',
                                                            Sort: '-State,ListOrder',
                                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'ListOrder', 'State', 'Tags', 'DueDate', 'Index', 'href', 'icon', '$type'],
                                                            SubTree:[
                                                                {
                                                                    Id:10000,
                                                                    Association: 'Actor',
                                                                    Expressions: ['$ref', 'Name', 'href']
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }

                                            ]
                                        },
                                        {
                                            Id: 20,
                                            Association: 'ModifiedNotes',
                                            Sort: '-ModificationDate, Id',
                                            Limit: 3,
                                            Expressions: ['Id', 'Title', 'Summary', 'href', 'ModificationDate', '$ref', '$type']
                                        }
                                    ]
                                }
                            ]
        }, onErrorShowAlert)
        user = res.User

        cache.set(cacheKey, user)

        tasksNo = 0
        user.SubscribedLists.forEach((l) => {
            if(l.List && l.List.Tasks)
                tasksNo += l.List.Tasks.length
        })
    }

    function showCachedDataFirst(cacheKey)
    {
        const cachedValue = cache.get(cacheKey)

        if(!cachedValue)
            return;

        user = cachedValue

        tasksNo = 0
        user.SubscribedLists.forEach((l) => {
            if(l.List && l.List.Tasks)
                tasksNo += l.List.Tasks.length
        })
    }

    async function onUpdateAllTags(allAllTags)
    {
        allTags = allAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }


    async function onRefreshDashboard(selectedRef='')
    {
        listToSelectAfterRefreshing = selectedRef
        await loadData()
    }

    let listToSelectAfterRefreshing = ''
    afterUpdate( () =>
    {
        if(listToSelectAfterRefreshing)
        {
            if(user.SubscribedLists && user.SubscribedLists.length > 0)
            {
                const listIdx = user.SubscribedLists.findIndex((l) => l.$ref == listToSelectAfterRefreshing)
                if((listIdx >= 0) && (listIdx < listElements.length))
                {
                    const listComponent = listElements[listIdx]
                    listComponent.activate()
                }
            }

            listToSelectAfterRefreshing = ''
        }

    })

    const pageOperations = []


    const title = "_; My day; Mi día; Mój dzień"
</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>


<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

{#if user}
    <Page   self={user}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title={user.Name}>
        <Paper>
        <!--section class="w-full flex justify-center"-->
            <PaperHeader>

            </PaperHeader>
                <h1>{title}</h1>

                <!--h2>_; Events; Eventos; Wydarzenia</h2>
                <p></p-->

                {#if tasksNo > 0 && user.SubscribedLists && user.SubscribedLists.length > 0}
                    <!--h2>_; Tasks; Tareas; Zadania</h2-->
                    {#each user.SubscribedLists as list, idx}
                        <SubscibedList {list}
                                    tasks={list.List.Tasks}
                                    getAllTags={() => allTags}
                                    {onUpdateAllTags}
                                    {users}
                                    {onRefreshDashboard}
                                    bind:this={listElements[idx]}/>
                    {/each}
                {:else}
                    <h2>_; Tasks; Tareas; Zadania</h2>
                    <p>Nie masz zadań na najbliższy czas.</p>
                {/if}

                {#if user.ModifiedNotes && user.ModifiedNotes.length > 0}
                    <h2>_; Latest documents; Últimos documentos; Ostatnie dokumenty</h2>
                    <section>
                    {#each user.ModifiedNotes as note}
                        <LatestNote {note}/>
                    {/each}
                    </section>
                {/if}

        <!---/section-->
        </Paper>
    </Page>
{:else}
    <Spinner/>
{/if}