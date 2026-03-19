<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    

    let username = ''
    let state = ''
    let validation_token = ''
    let redirect_uri = __WEBSITE__ + '/#/confirmemail'

    let message = ''

    const PHASE_VALIDATION = 0
    const PHASE_ERROR = 1
    const PHASE_EMAIL_CONFIRMED  = 2

    let phase = PHASE_VALIDATION

    let lock_buttons = false
    
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


        
        if(params.has("validation_token"))
        {
            validation_token = params.get("validation_token")
            if(!validation_token)
                validation_token = ''
        }
        else
            validation_token = ''


        
        
        /////////////////////////////////////////////////////////////////////

        if((!username) || (!validation_token))
        {
            message = `_;
                      The link to this page is incorrect. Please check that you have copied the entire address, including the parameters.;
                      El enlace que dirige a esta página es incorrecto. Comprueba que has copiado toda la dirección, incluidos los parámetros.;
                      Odnośnik nawigujący na tę stronę jest nieprawidłowy. Sprawdź czy skopiowałeś cały adres wraz z parametrami.`
            
            phase = PHASE_ERROR
        }
        else
        {
            phase = PHASE_VALIDATION
            await confirm_email_address()
        }
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

    
    async function confirm_email_address()
    {
        message = ''

        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("username",     username);
        data.append("redirect_uri", redirect_uri);
        data.append("state",        state);
        data.append("validation_token", validation_token);
        data.append("own_invitation_page", "true");

        try {
            const res = await fetch(`${config.iss}/auth/confirm_email`,
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
                phase = PHASE_EMAIL_CONFIRMED;
            }
            else
            {
                const result = await res.json();    
                if(result)
                {
                    message = result.error_description ? result.error_description : "";
                    if(!message)
                        message = result.error ? result.error : "";        
                }
                else
                {
                    message = '_; Unknwon error; Error desconocido; Nieznany błąd';
                    message += ": " + res.status
                }

                phase = PHASE_ERROR
            }
        }
        catch(err)
        {
            console.error(err)
            message = `_; 
                       Cannot connect to service;
                       No se puede conectar al servicio;
                       Nie można połączyć się z usługą`
            phase = PHASE_ERROR
        }
    }

    function go_to_main_page(e)
    {
        push('/')
    }


    const title = '_; Confirm your email address; Confirma tu dirección de correo electrónico; Potwierdź swój adres e-mail'

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
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


                        <!-- svelte-ignore empty-block -->
                        {#if phase == PHASE_VALIDATION}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                            
                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; 
                                        We check the correctness of the link...; 
                                        Comprobamos la validez del enlace...;
                                        Sprawdzamy poprawność odnośnika...</h4>
                                </div >
                            </div>
                            

                            <!-------------------------------------------------------------------->
                            <!-- POPUP FOOTER----------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <h4 class = "flex-none">

                            </h4>
                        {:else if phase == PHASE_ERROR}

                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                            
                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Error; Error; Błąd</h4>
                                    <p class="flex flex-row">
                                        {message}
                                    </p>
                                </div >
                            </div>
                            

                            <!-------------------------------------------------------------------->
                            <!-- POPUP FOOTER----------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <h4 class = "flex-none">
                                <div class="flex flex-col  gap-2">

                                <button  type="submit"
                                        class="px-4 my-2
                                        bg-stone-100 dark:bg-stone-800
                                        outline outline-offset-2 outline-2
                                        outline-stone-200 dark:outline-stone-500
                                        focus:outline-stone-300 dark:focus:outline-stone-400
                                        hover:bg-stone-200 hover:dark:bg-stone-700
                                        "
                                        tabindex="0"
                                        on:click={go_to_main_page}> 
                                        _; Go to the home page; Ir a la página principal; Przejdź na stronę główną
                                </button>
                            </div>
                            </h4>

                        {:else if phase == PHASE_EMAIL_CONFIRMED}

                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">

                                <p>
                                    _;
                                    Your email address has been confirmed. Click the button below to go to the app.;
                                    Tu dirección de correo electrónico ha sido confirmada. Haz clic en el botón de abajo para ir a la aplicación.;
                                    Twój adres e-mail został potwierdzony. Kliknij przycisk poniżej, aby przejść do aplikacji. 
                                </p>
                                
                                {#if message}
                                <div class="px-2 outline outline-4  bg-red-200 outline-red-200 dark:bg-red-950 dark:outline-red-950">
                                    <p class="flex flex-row">
                                        {message}
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
                                        on:click={go_to_main_page}> 
                                        _; Go to the home page; Ir a la página principal; Przejdź na stronę główną
                                </button>
                            </div>
                            </h4>

                        {/if}

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