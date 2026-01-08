<script>
	import {session, Authorized, NotAuthorized, signInHRef, signOutHRef, reef} from '@humandialog/auth.svelte'
    import {
        onErrorShowAlert, Page
    } from '$lib'
    import {parse} from 'qs'
    import {querystring, push} from 'svelte-spa-router'
    import {FaDownload} from 'svelte-icons/fa'

    let machine_hash = '';
    let tenant = ''
    let scope = ''

    $: params = parse($querystring, { ignoreQueryPrefix: true });
    $: on_params_changed(params);
    $: update($session)

    function on_params_changed(params)
    {
        machine_hash    = (!!params["machine_hash"])        ? params["machine_hash"]        : "";
        tenant          = (!!params["tenant"])              ? params["tenant"]              : "";
        scope           = (!!params["scope"])               ? params["scope"]               : "";
    }

    function update(...args)
    {

    }

    async function generare(e)
    {
        try
        {
            const res = await reef.fetch(`/auth/v2/license?tenant=${tenant}&scope=${scope}&code_verifier=${machine_hash}`)

            if(res.ok)
            {
                const blob = await res.blob()
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a"); // Or maybe get it from the current document
                link.href = blobUrl;
                link.download = "TilosLicense.json"

                //document.body.appendChild(link); // Or append it whereever you want
                link.click() //can add an id to be specific if multiple anchor tag, and use #id

                URL.revokeObjectURL(blobUrl)
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

    const title = "Request license file"

</script>

<Page   self={{}}
        clearsContext=''
        title={title}>

    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl ">


                <h1>
                    {title}
                </h1>


                    {#if machine_hash && tenant && scope}
                        <p> Here you can generate and download Tilos license File.</p>
                        <p>The license will be generated only for one computer with
                            <code>{machine_hash}</code>
                        identifier</p>

                        <button type="button"
                                class="
                                py-2.5 px-4
                                text-xs font-thin text-stone-100 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-700 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-600
                                border border-stone-200 focus:outline-none dark:border-stone-600
                                flex items-center"
                                on:click={generare}>
                            <div class="w-3.5 h-3.5 mr-1"><FaDownload/></div>
                            <span class="ml-1">Download license</span>

                        </button>


                        <br>
                    {:else}
                        <p>This page should be opened by Tilos License Manager</p>
                    {/if}
        </article>
    </section>
</Page>
