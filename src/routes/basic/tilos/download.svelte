<script>
    import {Page  
        } from '$lib'

    import {link} from 'svelte-spa-router'
	

    $: init()

    let releases = null
    let releaseNotes = null
    let patches = null
    let latestRelease = null
    let previusRelease = null
    let olderReleases = null

    async function init(...args)
    {
        releases = await getDoc('/doc/tilos-releases.json')
        releaseNotes = await getDoc('/doc/tilos-release-notes.json')
        patches = await getDoc('/doc/tilos-pacthes.json')

        latestRelease = releases[0]
        previusRelease = releases[1]
        olderReleases = releases.toSpliced(0, 2)
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
    <title>Downloads | {__APP_TITLE__}</title>
</svelte:head>

<Page   self={{}} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title="Downloads">
        <section class="w-full flex justify-center">
            <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
                <h1>
                    Downloads
                </h1>

                <p class="lead">
                    Here you will find installers for all recent versions of Tilos and release notes
                </p>
                
                {#if latestRelease}
                    <h2>Latest release</h2>
                    <h3>{latestRelease.name}</h3>
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

                {#if previusRelease}
                    <h2>Previous release</h2>
                    <h3>{previusRelease.name}</h3>
                    <ul>
                        {#each previusRelease.installers as installer}
                            <li>
                                <a href={installer.href} download>
                                    {installer.name}
                                </a>
                            </li>
                        {/each}
                    </ul>
                {/if}

                {#if patches && patches.length > 0}
                    <h2>Patches</h2>
                    {#each patches as patch}
                        <h3>{patch.name}</h3>
                        <p>
                            {@html patch.desc}
                        </p>
                    {/each}
                {/if}

                {#if olderReleases && olderReleases.length > 0}
                    <h2>Older releases</h2>
                    {#each olderReleases as release}
                        <h3>{release.name}</h3>
                        <ul>
                            {#each release.installers as installer}
                                <li>
                                    <a href={installer.href} download>
                                        {installer.name}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    {/each}
                {/if}

                {#if releaseNotes}
                    <h2>Release notes</h2>
                    <ul>
                        {#each releaseNotes as note}
                            <li>
                                <a href={note.href} use:link>
                                    {note.name}
                                </a>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </article>
        </section>
    </Page>