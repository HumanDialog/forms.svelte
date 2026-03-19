<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store, isValidEmail} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    
    
    let username = ''
    let firstname = ''
    let state = ''
    let code = ''
    let error_code = ''
    let error_description = ''
    
    const PHASE_ASK_ADDITIONAL_INFO = 2
    const PHASE_REGISTERING = 3
    

    let phase = 0

    let error_message = ''

    let ask_workspace_name = true
    let captcha_element;

    let tenant = ''
    let dont_create_app_user = false    // special case for Tilos
    let org_name = true
    let workspace_name_title = ''

    let tenant_name = ''
    let terms_and_conditions_consent = false
    let privacy_policy_consent = false

    $: onParamsChanged($location, $querystring)
    async function onParamsChanged(...args)
    {
        const params = new URLSearchParams($querystring);
        if(params.has("code"))
        {
            code = params.get("code")
            if(!code)
                code = ''
        }
        else
            code = '' 

        if(params.has("username"))
        {
            username = params.get("username")
            if(!username)
                username = ''
        }
        else
            username = '' 


        if(params.has("firstname"))
        {
            firstname = params.get("firstname")
            if(!firstname)
                firstname = ''
        }
        else
            firstname = '' 


        if(params.has("state"))
        {
            state = params.get("state")
            if(!state)
                state = ''
        }
        else
            state = ''
        
        if(params.has("error"))
        {
            error_code = params.get("error")
            if(!error_code)
                error_code = ''
        }
        else
            error_code = ''

        if(params.has("error_description"))
        {
            error_description = params.get("error_description")
            if(!error_description)
                error_description = ''
        }
        else
            error_description = ''

        if(error_code)
        {
            error_message = error_description
            if(!error_message)
                error_message = error_code

            error(error_message);
        }
        else if(!code)
        {
            error_message = `_;
                      The link to this page is incorrect. Please check that you have copied the entire address, including the parameters.;
                      El enlace que dirige a esta página es incorrecto. Comprueba que has copiado toda la dirección, incluidos los parámetros.;
                      Odnośnik nawigujący na tę stronę jest nieprawidłowy. Sprawdź czy skopiowałeś cały adres wraz z parametrami.`

            error(error_message);
        }
        else
            setup_ask_additional_info_phase()
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

    

    function keydown(e)
    {
        if(e.key == 'Enter')
        {
            e.preventDefault()
            e.stopPropagation()
            submit(e)   
        }
    }

    function setup_ask_additional_info_phase()
    {
        const config = $session.configuration
        tenant = config.tenant
        ask_workspace_name = !tenant || org_name
        
        setTimeout( () =>
        {
            if(grecaptcha && captcha_element)
            {
                const theme = $dark_mode_store == 'dark' ? 'dark' : 'light';
                grecaptcha.render(captcha_element, { 'sitekey' : '6Ld2OecnAAAAADonx1RLLbb1EdWC1kndQCsuht30', 'theme':theme });
            }
        }, 1000)

        if(tenant)
        {
            if(dont_create_app_user)    // tmp for tilos
                workspace_name_title = '_; Company name; Nombre de la empresa; Nazwa firmy'
            else
                workspace_name_title = '_; Your group name; El nombre de tu grupo; Nazwa twojej grupy'
        }
        else
            workspace_name_title = '_; Company name; Nombre de la empresa; Nazwa firmy'

        phase = PHASE_ASK_ADDITIONAL_INFO
    }

    async function submit(e)
    {
        let captcha_token = grecaptcha?.getResponse();
        if(!captcha_token)
        {
            error_message = "_; You must complete the reCAPTCHA; Debes completar el reCAPTCHA; Musisz wypełnić reCAPTCHA"
            return;
        }

        if(ask_workspace_name)
        {
            if(!tenant_name)
            {
                if(tenant)
                {
                    if(dont_create_app_user)    // tmp for tilos
                        error_message = "_; Enter company name; Introduce el nombre de la empresa; Wpisz nazwę firmy"
                    else
                        error_message = '_; Enter your group name; Introduce el nombre de tu grupo; Wpisz nazwę swojej grupy'
                }
                else
                    error_message = '_; Enter company name; Introduce el nombre de la empresa; Wpisz nazwę firmy'
                
                //is_tenant_invalid = true
                return;
            }
        }


        if(!terms_and_conditions_consent)
        {
            error_message = "_; You need to agree with Terms and Conditions; Debes aceptar los Términos y condiciones; Musisz zaakceptować Warunki korzystania z serwisu"
            return;
        }

        if(!privacy_policy_consent)
        {
            error_message = "_; You need to accept the Privacy Policy; Debes aceptar la Política de privacidad; Musisz zaakceptować Politykę prywatności"
            return;
        }

        // zakładanie konta
        phase = PHASE_REGISTERING


        // do creation requests
        const config = $session.configuration
        let scopes = config.scope.split(' ');
        if(scopes.length <= 0)
            return error('_; Configuration error. The scope is empty; Error de configuración. scope está vacío; Błąd konfiguracji. scope jest puste');

        scopes = scopes.filter( s => (s!='openid') && (s!='profile') && (s!='email') && (s!='address') && (s!='phone'));
        if(scopes.length <= 0)
            return error('_; Configuration error. app_id is missing in scope; Error de configuración. Falta el app_id en scope; Błąd konfiguracji. Brakuje app_id w scope')
        

        const app_id = scopes[0];
        const client_id = config.client_id
        const state = ''
        const access_details = ''

        let success = false

        if(tenant)
        {
            success = await register_user_in_public_tenant( tenant,
                                                app_id,
                                                tenant_name,
                                                code,
                                                firstname,
                                                captcha_token,
                                                dont_create_app_user,
                                                access_details)

            
        }
        else
        {
            // todo /dev/create-tenant-with-code
            success = false;
        }

        
        
        // authorize
        if(success)
            await signin_with_code(username, code)

    }

    async function register_user_in_public_tenant(tenant,
                                                app_id,
                                                tenant_name,
                                                code,
                                                firstname,
                                                captcha_token,
                                                dont_create_app_user,
                                                access_details)
    {
        if(!tenant_name)
            tenant_name = "My group";

        
        const config = $session.configuration

        const body = {
                code: code,
                app_id: app_id,
                tenant: tenant,
                org_name: tenant_name,
                captcha: captcha_token,
                firstname: firstname,
                dont_create_app_user: dont_create_app_user,
                access_details: access_details
            }

        
        try {
            let host;
            if(dont_create_app_user)
                host = config.iss
            else
                host = get_issuer_at_tenant(tenant, config.iss)
        
            const  res = await fetch(  host + "/dev/add-to-public-tenant-with-code",
                                    {
                                        method: 'post',
                                        headers : new Headers({
                                            'Authorization': 'Basic '+btoa(`${config.client_id}:${config.client_secret}`),
                                            'Content-Type': 'application/json',
                                            'Accept': 'application/json'}),
                                        body : JSON.stringify(body)
                                    });
            if(!res.ok)
            {
                const result = await res.json();    
                
                error_message = (!!result.error_description) ? result.error_description : "";
                if(!error_message)
                    error_message = (!!result.error) ? result.error : "";

                return error(error_message)
            }
            else
                return true;
        }
        catch(err)
        {
            console.error(err)

            error_message = `_; 
                            Cannot connect to service;
                            No se puede conectar al servicio;
                            Nie można połączyć się z usługą`

            return error(error_message)
        }
    }

    

    function get_issuer_at_tenant(tid, iss)
    {   
        const url = new URL(iss);
        url.host = `${tid}.${url.host}`;
        return url.toString().replace(/\/$/, "");
    }


    async function signin_with_code(username, code)
    {
        if(!username)
            return;

        if(!code)
            return;

        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("client_id",    config.client_id);
        data.append("grant_type",   "authorization_code");
        data.append("redirect_uri", `${__WEBSITE__}/#/signupgoogle`)
        data.append("code_verifier", $session.pop_code_verifier());
        data.append("code", code);

        if(config.tenant)
            data.append("tenant",   config.tenant);

        if(config.groups_only)
            data.append("groups_only", "true");

        try {
            const res = await fetch(`${config.iss}/auth/token`,
                                {
                                    method: 'post',
                                    headers: new Headers({
                                        'Authorization': 'Basic '+btoa(`${config.client_id}:${config.client_secret}`),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'Accept': 'application/json'
                                    }),
                                    body: data,
                                    credentials: 'include'
                                })
                
            if(res.ok)
            {
                error_message = ''
                
                let tokens = await res.json()

                let redirect_to = ''
                switch($session.useTokensToSignIn(tokens))
                {
                case Session.SIGNIN_SUCCESS:
                    redirect_to = '/';
                    break;

                case Session.SIGNIN_CHOOSE_TENANT:
                    redirect_to = '#/auth/choose-tenant?redirect=' + encodeURIComponent('/');
                    break;

                case Session.SIGNIN_FAILED:
                    error('Something wrong with tokens')
                    break;
                }

                if(redirect_to)
                {
                    await tick();
                    window.location.replace(redirect_to)
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

                error(error_message)
            }
        }
        catch(err)
        {
            console.error(err)
            error_message = "_; Cannot connect to service; No se puede conectar al servicio; Nie można połączyć się z usługą"
            error(error_message)
        }

            
    }

    function error(msg)
    {
        push(`/result?msg=${encodeURIComponent(msg)}`) 
        return false
    }

    const title = '_; Sign up; Regístrate; Zarejestruj się'
   
</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
    <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
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
                                <div class="grow ">
                                    <span class="text-left">{title}</span>
                                </div>
                            </div>
                        </h3>

                        <!-- svelte-ignore empty-block -->
                        {#if phase == PHASE_ASK_ADDITIONAL_INFO}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                                <p>
                                    _;
                                    We need some more information;
                                    Necesitamos más información;
                                    Potrzebujemy więcej informacji
                                </p>

                                {#if ask_workspace_name}
                                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                        <h4>{workspace_name_title}</h4>
                                        <input type="text" required autocomplete="organization" autofocus bind:value={tenant_name} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </div>
                                {/if}

                                <div bind:this={captcha_element} class="my-4 w-[304px] h-[78px]"></div>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <div class="flex flex-row gap-2">
                                        <input type="checkbox" id="terms" required bind:value={terms_and_conditions_consent} tabindex="0"
                                                class="flex-none border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                        <label for="terms">
                                            _;
                                            I agree to the site's terms of service;
                                            Acepto las condiciones de uso del sitio web;
                                            Wyrażam zgodę na warunki korzystania z serwisu
                                            <a href="#/terms-and-conditions" target="_blank" class="ml-1">
                                                _;
                                                (Link);
                                                (Enlace);
                                                (Link)
                                            </a>
                                        </label>
                                    </div>

                                    <div class="flex flex-row gap-2">
                                        <input type="checkbox" id="privacy" required bind:value={privacy_policy_consent} tabindex="0"
                                                class="flex-none border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                        <label for="privacy">
                                            _; 
                                            I agree to the privacy policy;
                                            Acepto la política de privacidad;
                                            Wyrażam zgodę na politykę prywatności
                                            <a href="#/privacy-policy" target="_blank" class="ml-1">
                                                _;
                                                (Link);
                                                (Enlace);
                                                (Link)
                                            </a>
                                        </label>
                                    </div>
                                </div>
                                
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
                                            class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-700
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-600
                                            "
                                            tabindex="0"
                                            on:click={submit}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>
                            </h4>
                        {:else if phase == PHASE_REGISTERING}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                                <p>
                                    _;
                                    Creating an account. Please wait...;
                                    Creación de la cuenta. Por favor, espere...;
                                    Zakładanie konta. Proszę czekać...
                                </p>
                            </div>
                        

                            <!-------------------------------------------------------------------->
                            <!-- POPUP FOOTER----------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <h4 class = "flex-none">

                                <div class="flex flex-row justify-end gap-2">

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