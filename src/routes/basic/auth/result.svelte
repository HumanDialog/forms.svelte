<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    
    let title = ''
    let msg = ''

    
    $: switchBodyClass($dark_mode_store);
    $: success = onParamsChanged($location, $querystring)

    function onParamsChanged(...args)
    {
        const params = new URLSearchParams($querystring);
        if(params.has("msg"))
        {
            msg = params.get("msg")
            if(!msg)
                msg = ''
        }
        else
            msg = '' 

        title = "_; Error; Error; Błąd"
        if(params.has('status_code'))
        {
            const status_code = parseInt(params.get('status_code'))
            if(status_code == 200)
            {
                title = "_; Success; Éxito; Sukces"
                return true
            }    
        }

        return false
    }

    function switchBodyClass(...args)
    {
        document.body.className = $dark_mode_store;
    }

    onMount( () => {
        return () => {
            if($dark_mode_store)
                document.body.classList.remove($dark_mode_store)
        }
    })

    function submit(e)
    {
        push('/')
    }

    const page_title = '_; Service message; Mensaje de servicio; Komunikat serwisu'

</script>

<svelte:head>
    <title>{page_title} | {__APP_TITLE__}</title>
</svelte:head>


{#key $wholeAppReloader}

<div class="    {$dark_mode_store} thin-scrollbar">

    <div class="bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-400
                pb-20">
        <section class=""> 
            <Header transparent hide_links theme='stone' light={$dark_mode_store != 'dark'}/>
        </section>

        <!-- Content -->
        <div class="sm:mb-40" aria-labelledby="modal-title" role="dialog" aria-modal="true" >
            <div class="">
            <div class="flex  items-end justify-center p-1 text-center sm:items-center sm:p-0">
                <div class=" p-0
                            sm:my-8 w-full sm:max-w-lg
                            bg-stone-100 dark:bg-stone-800
                            rounded-lg

                            sm:shadow-xl sm:shadow-slate-700/70
                            sm:dark:shadow-black/80
                            sm:outline sm:outline-1 sm:outline-stone-500

                            text-left transition-all">
                    
                    <div class=" paper w-full
                                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                                m-0 pt-5 pb-5 px-1 sm:px-8
                                sm:rounded
                                bg-stone-200 dark:bg-stone-900
                                flex flex-col">

                        <!-------------------------------------------------------------------->
                        <!-- POPUP HEADER ---------------------------------------------------->
                        <!-------------------------------------------------------------------->
                        <h3 class = "flex-none">
                            <div class="w-full flex flex-row justify-between">
                                <!--div class="py-1.5  flex flex-row justify-between">
                                    <button class="mr-4 w-6
                                                hover:bg-stone-200 hover:dark:bg-stone-700
                                                hover:outline hover:outline-8
                                                hover:outline-stone-200 hover:dark:outline-stone-700"
                                        ><Ricon icon = 'arrow-up' />
                                    </button>
                                    <button class="mr-4 w-6
                                                hover:bg-stone-200 hover:dark:bg-stone-700
                                                hover:outline hover:outline-8
                                                hover:outline-stone-200 hover:dark:outline-stone-700">
                                        <Ricon icon = 'check-check' />
                                    </button>
                                </div-->
                                <div class="grow ">
                                    <span class="text-left">{title}</span>
                                </div>
                            </div>
                        </h3>


                        <!-------------------------------------------------------------------->
                        <!-- POPUP CONTENT---------------------------------------------------->
                        <!-------------------------------------------------------------------->
                        <div class="grow">
                            <p class="flex flex-row">
                                {msg}
                            </p>
                        </div>
                        

                        <!-------------------------------------------------------------------->
                        <!-- POPUP FOOTER----------------------------------------------------->
                        <!-------------------------------------------------------------------->
                        <h4 class = "flex-none">

                            <div class="flex flex-row justify-end gap-2">

                                <button  type="submit"
                                        class="px-4 mx-2
                                        bg-stone-100 dark:bg-stone-700
                                        outline outline-offset-2 outline-2
                                        outline-stone-200 dark:outline-stone-500
                                        focus:outline-stone-300 dark:focus:outline-stone-400
                                        hover:bg-stone-200 hover:dark:bg-stone-600
                                        "
                                        tabindex="0"
                                        on:click={submit}> 
                                        _; Go to the home page; Ir a la página principal; Przejdź na stronę główną
                                </button>
                            </div>

                        </h4>


                    </div>


                </div>
            </div>
            </div>
        </div>

        <section>
            <Footer theme='stone'/>
        </section>
    </div>
</div>

{/key}


<style lang="scss">


    /* bg-white */
    :global(body)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(255 255 255 / var(--tw-bg-opacity));
    }


    :global(body.dark)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(12 10 9 / var(--tw-bg-opacity));

    }

</style>