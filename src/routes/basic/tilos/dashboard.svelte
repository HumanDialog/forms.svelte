<script>
    import {Page, onErrorShowAlert, List, ListTitle, ListSummary, ListStaticProperty, ListDateProperty, ListComboProperty, ComboSource, Icon
        } from '$lib'

    import {reef, session, signInHRef} from '@humandialog/auth.svelte'
    import {FaComment} from 'svelte-icons/fa'
    import {link} from 'svelte-spa-router'

    $: init($session)

    let latestThreads = []
    let latestsDocuments = []
    let latestRelease = null
    let releaseNotes = null

    async function init(...args)
    {
        latestThreads = []
        if($session.isActive)
        {
            const res = await reef.post('group/query', {
                                    Id: 1,
                                    Name: '',
                                    ExpandLevel: 4,
                                    Tree: [
                                        {
                                            Id: 1,
                                            Association: 'AllFolders',
                                            Filter: 'Status=FS_LATEST_ELEMENTS and Kind=FK_DISCUSSION',
                                            Expressions:['$ref', 'Id'],
                                            SubTree: [
                                                {
                                                    Id: 10,
                                                    Association: 'Notes',
                                                    Sort: '-Order',
                                                    Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', 'ModificationDate', 'Tags', 'NotesCount'],
                                                    SubTree:[
                                                        {
                                                            Id:100,
                                                            Association: 'Note/ModifiedBy',
                                                            Expressions: ["$ref", "Name"]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }, onErrorShowAlert)

            if(res && res.Folder &&  Array.isArray(res.Folder) && res.Folder.length > 0 && res.Folder[0].Notes)
                latestThreads = res.Folder[0].Notes

        }

        const releases = await getDoc('/doc/tilos-releases.json')
        latestRelease = releases[0]

        const allReleaseNotes = await getDoc('/doc/tilos-release-notes.json')
        releaseNotes = allReleaseNotes[0]
    }

    async function getDoc(docName)
    {
        try {
            const res = await fetch(docName)
            if(res.ok)
            {
                return await res.json()
            }
            else
                return []
        }
        catch(err)
        {
            console.error(err)
            return []
        }
    }

    function getPageOperations()
    {
        return []
    }

</script>

<svelte:head>
    <title>Home | {__APP_TITLE__}</title>
</svelte:head>

<Page   self={{}}
            toolbarOperations={getPageOperations()}
            clearsContext='sel props'
            title="Home">

     <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
            <h1>
                Welcome to the Tilos community
            </h1>

            <p class="lead">
                Here you will find the most important links useful for your daily work with Tilos
            </p>

            {#if $session.isActive}
                {#if latestThreads && latestThreads.length > 0}
                    <h2>Latest discussions</h2>

                    <section class="not-prose">
                    <List   objects={latestThreads}
                            {list_properties}
                            toolbarOperations={ (el) => [] }
                            orderAttrib='Order'>
                        <ListTitle      a='Title'
                                        hrefFunc={(note) => `${note.href}`}
                                        />
                        <ListSummary    a='Summary'
                                        />

                        <ListStaticProperty name="NotesCount" postfix='replies'/>

                        <ListDateProperty name='ModificationDate' detailed editable={false}/>
                        <ListComboProperty name="Note/ModifiedBy" association editable={false}>
                            <ComboSource key="$ref" name='Name'/>
                        </ListComboProperty>

                        <!--ListTags a='Tags'
                                getAllTags={() => allTags}
                                readOnly
                                /-->

                        <span slot="left" let:element>
                            <Icon component={FaComment}
                                class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2  mr-1"/>
                        </span>
                    </List>
                    </section>

                {/if}
            {:else}
                <p>
                    <a href={$signInHRef}>Sign in</a> first to see whole community content.
                    If you don't have an account yet, <a href="/tcontact" use:link>contact us</a> so we can send you an invitation link for free.
                </p>
            {/if}

            {#if latestRelease && releaseNotes}
                <h2>Latest release</h2>
                <h3>{latestRelease.name}</h3>
                <a href={releaseNotes.href} use:link>Release Notes</a>
                <ul>
                    {#each latestRelease.installers as installer}
                        <li>
                            <a href={installer.href} download>
                                {installer.name}
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}

        </article>
    </section>

</Page>
