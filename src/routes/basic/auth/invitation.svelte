<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    

    let username = ''
    let state = ''
    let scope = ''
    let tenant = ''
    let validation_token = ''
    
    let error_message = ''

    $: onParamsChanged($location, $querystring)

    async function onParamsChanged(...args)
    {
        const params = new URLSearchParams($querystring);
        if(params.has("username"))
        {
            username = params.get("username")
            if(!username)
                username = ''
        }
        else
            username = ''

        
        if(params.has("state"))
        {
            state = params.get("state")
            if(!state)
                state = ''
        }
        else
            state = ''


        if(params.has("scope"))
        {
            scope = params.get("scope")
            if(!scope)
                scope = ''
        }
        else
            scope = ''

        if(params.has("tenant"))
        {
            tenant = params.get("tenant")
            if(!tenant)
                tenant = ''
        }
        else
            tenant = ''


        if(params.has("validation_token"))
        {
            validation_token = params.get("validation_token")
            if(!validation_token)
                validation_token = ''
        }
        else
            validation_token = ''

        
        /////////////////////////////////////////////////////////////////////

       
    }


    $: switchBodyClass($dark_mode_store);
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

    async function confirm(e)
    {
        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("username", username);
        data.append("state",    state);
        data.append("scope",    scope);
        data.append("tenant",   tenant);
        data.append("validation_token",     validation_token);
        data.append("own_invitation_page", "true");

        try {
            const res = await fetch(`${config.iss}/auth/accept_invitation`,
                                {
                                    method: 'post',
                                    headers: new Headers({
                                        'Authorization': 'Basic '+btoa(`${config.client_id}:${config.client_secret}`),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'Accept': 'application/json'
                                    }),
                                    body: data
                                })
            if(res.ok)
            {
                const result = await res.json();

                if(result.need_set_password)
                {
                    const redirect_to = `/changepassword?username=${username}&state=${encodeURIComponent(state)}&validation_token=${result.validation_token}&new_user_setup`
                    push(redirect_to)
                }
                else
                {
                    push('/signin')
                }
                
            }
            else
            {
                const result = await res.json();    
                if(result)
                {
                    error_message = result.error_description ? result.error_description : "";
                    if(!error_message)
                        error_message = result.error ? result.error : "";        
                }
                else
                {
                    error_message = '_; Unknwon error; Error desconocido; Nieznany błąd';
                    error_message += ": " + res.status
                }

                
            }
        }
        catch(err)
        {
            console.error(err)
            error_message = `_; 
                       Cannot connect to service;
                       No se puede conectar al servicio;
                       Nie można połączyć się z usługą`
            
        }
    }

   
    const title = '_; Invitation; Invitación; Zaproszenie'

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>


<!-- svelte-ignore empty-block -->

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
                        <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                        
                                <p>
                                    _;
                                    Click the button below to confirm your invitation to the application's working group;
                                    Haga clic en el botón siguiente para confirmar la invitación al grupo de trabajo de la aplicación;
                                    Kliknij w poniższy przycisk aby potwierdzić zaproszenie do grupy roboczej aplikacji
                                </p>


                                {#if error_message}
                                    <div class="px-2 outline outline-4  bg-red-200 outline-red-200 dark:bg-red-950 dark:outline-red-950">
                                        <p class="flex flex-row">
                                            {error_message}
                                        </p>
                                    </div>
                                {/if}
                        </div>
                            

                        <!-------------------------------------------------------------------->
                        <!-- POPUP FOOTER----------------------------------------------------->
                        <!-------------------------------------------------------------------->
                        <h4 class = "flex-none">
                            <div class="flex flex-row justify-end gap-2">

                            <button  type="submit"
                                    class="px-4 my-2
                                    bg-stone-100 dark:bg-stone-800
                                    outline outline-offset-2 outline-2
                                    outline-stone-200 dark:outline-stone-500
                                    focus:outline-stone-300 dark:focus:outline-stone-400
                                    hover:bg-stone-200 hover:dark:bg-stone-700
                                    "
                                    tabindex="0"
                                    on:click={confirm}> 
                                    _; Confirm; Confirmar; Potwierdź
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