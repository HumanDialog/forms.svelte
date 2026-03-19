<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store, isValidEmail} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    
    
    let redirect = '/'
    let username = ''
    let password = ''
    let password_2 = ''
    
    const PHASE_ASK_EMAIL_ADDRESS = 1
    const PHASE_USER_EXISTS__ASK_PASSWORD = 2
    const PHASE_SETUP_PASSWORD = 3
    const PHASE_ASK_ADDITIONAL_INFO = 4
    const PHASE_REGISTERING = 5
    const PHASE_USER_ALREADY_REGISTERED = 6

    let phase = PHASE_ASK_EMAIL_ADDRESS

    let has_user = false
    let error_message = ''

    let ask_workspace_name = true
    let ask_name = true
    let ask_phone = false
    let captcha_element;

    let tenant = ''
    let dont_create_app_user = false    // special case for Tilos
    let org_name = true
    let workspace_name_title = ''

    let tenant_name = ''
    let firstname = ''
    let phone = ''
    let terms_and_conditions_consent = false
    let privacy_policy_consent = false

    $: onParamsChanged($location, $querystring)
    async function onParamsChanged(...args)
    {
        const params = new URLSearchParams($querystring);
        if(params.has("redirect"))
        {
            redirect = params.get("redirect")
            if(!redirect)
                redirect = '/'
        }
        else
            redirect = '/' 

        phase = PHASE_ASK_EMAIL_ADDRESS
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
            validate_current_step(e)   
        }
    }

    async function validate_current_step(e)
    {
        error_message = ''
        switch(phase)
        {
        case PHASE_ASK_EMAIL_ADDRESS:
            return check_email_address_and_go_forward(e)
            
        case PHASE_USER_EXISTS__ASK_PASSWORD:
            return check_password_and_go_forward(e)
            
        case PHASE_SETUP_PASSWORD:
            return validate_new_password_and_go_forward(e)

        case PHASE_ASK_ADDITIONAL_INFO:
            return create_user_account_and_redirect_to_app(e)

        case PHASE_USER_ALREADY_REGISTERED:
            return signin_and_redirect_to_app(e)
        }
    }

    async function check_email_address_and_go_forward(e)
    {
        if(!username)
        {
            error_message = '_; The email address is empty; La dirección de correo electrónico está vacía; Pole adresu e-mail jest puste'
            return;   
        }

        if(!isValidEmail(username))
        {
            error_message = '_; The email address is not valid; La dirección de correo electrónico no es válida; Podany adres e-mail jest nieprawidłowy'
            return;
        }

        // check if user exists
        const config = $session.configuration
        let data = new URLSearchParams();
        data.append("username", username);

        try {
                error_message = '';
                const  res = await fetch(  `${config.iss}/auth/has_user`,
                                        {
                                            method: 'post',
                                            headers : new Headers({
                                                'Authorization': 'Basic '+btoa(`${config.client_id}:${config.client_secret}`),
                                                'Content-Type': 'application/x-www-form-urlencoded',
                                                'Accept': 'application/json'}),
                                            body : data
                                        });
                
                has_user = res.ok
                if(has_user)
                {
                    phase = PHASE_USER_EXISTS__ASK_PASSWORD;
                }
                else
                {
                    phase = PHASE_SETUP_PASSWORD;
                }
        }
        catch(err)
        {
            console.error(err)
            error_message = `_; 
                            Cannot connect to service;
                            No se puede conectar al servicio;
                            Nie można połączyć się z usługą`
            return;
        }
    

    }

    async function check_password_and_go_forward(e)
    {
        if(!password)
        {
            error_message = `_; 
                            The password field is empty;
                            El campo de la contraseña está vacío;
                            Pole hasła jest puste`
            return
        }

        
        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("client_id",    config.client_id);
        data.append("scope",        config.scope)
        data.append("username",     username);
        data.append("password",     password)
        
        if(config.tenant)
            data.append("tenant",   config.tenant);

        if(config.groups_only)
            data.append("groups_only", "true");

        try {
            const res = await fetch(`${config.iss}/auth/checkpassword`,
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
                error_message = ''
                
                let content = await res.json()
                if(content.password_match)
                {
                    if(content.has_access_already)
                    {
                        phase = PHASE_USER_ALREADY_REGISTERED
                    }
                    else
                    {
                        setup_ask_additional_info_phase()
                    }
                }
                else
                {
                    error_message = "_; The password you entered is incorrect; La contraseña que has introducido es incorrecta; Podane hasło jest nieprawidłowe"
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
            error_message = "_; Cannot connect to service; No se puede conectar al servicio; Nie można połączyć się z usługą"
        }

    }

    async function validate_new_password_and_go_forward(e)
    {
        if(!password)
        {
            error_message = `_; 
                            The password field is empty. Please enter at least 4 characters;
                            El campo de la contraseña está vacío. Introduce al menos 4 caracteres;
                            Pole hasła jest puste. Wpisz co najmniej 4 znaki.`
        }

        if(password.length < 4)
        {
            error_message = "_; Use at least 4 characters; Utilice al menos 4 caracteres; Użyj co najmniej 4 znaków"
            return;
        }

        if(password != password_2)
        {
            error_message = "_; The passwords entered are different; Las contraseñas introducidas son diferentes; Wprowadzone hasła są różne";
            return;
        }

        setup_ask_additional_info_phase()
    }

    function setup_ask_additional_info_phase()
    {
        const config = $session.configuration
        tenant = config.tenant
        ask_workspace_name = !tenant || org_name
        ask_name = true
        ask_phone = false

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

    async function create_user_account_and_redirect_to_app(e)
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


        if(ask_name)
        {
            if(!firstname)
            {
                error_message = "_; Enter your name; Escribe tu nombre; Wpisz swoje imię"
                //is_firstname_invalid = true
                return;
            }
        }
       
        if(ask_phone)
        {
            if(!phone)
            {
                error_message = "_; Enter your phone number; Introduce tu número de teléfono; Wpisz swój numer telefonu"
                //is_phone_invalid = true
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
            success = await create_user_in_public_tenant( tenant,
                                                app_id,
                                                tenant_name,
                                                username,
                                                password,
                                                firstname,
                                                phone,
                                                client_id,
                                                captcha_token,
                                                redirect,
                                                state,
                                                dont_create_app_user,
                                                access_details)

            
        }
        else
        {
            success = await create_new_user_and_tenant(    app_id,
                                                tenant_name,
                                                username,
                                                password,
                                                firstname,
                                                phone,
                                                client_id,
                                                captcha_token,
                                                redirect,
                                                state,
                                                dont_create_app_user,
                                                access_details);
        }

        
        
        // authorize
        if(success)
            await signin(username, password)

    }

    const content_pl = `Cześć!

Dzięki za rejestrację. Twoje konto w ${__APP_TITLE__} jest już aktywne i możesz z niego korzystać bez przeszkód.

Mamy tylko jedną prośbę: potwierdź swój adres e-mail, klikając w poniższy link. Pozwoli nam to zadbać o bezpieczeństwo Twoich danych i ułatwi odzyskanie hasła w przyszłości.

<LINK>

Dobrego korzystania z aplikacji!
Zespół ${__APP_TITLE__}`

    const content_en = `Hi!

Thanks for signing up. Your account on ${__APP_TITLE__} is now active and ready to use.

We have just one request: please confirm your email address by clicking the link below. This will help us keep your data secure and make it easier to recover your password in the future.

<LINK>

Enjoy using the app!
The ${__APP_TITLE__} Team`

    const content_es = `¡Hola!

Gracias por registrarte. Tu cuenta en ${__APP_TITLE__} ya está activa y puedes usarla sin problemas.

Solo te pedimos una cosa: confirma tu dirección de correo electrónico haciendo clic en el enlace que aparece a continuación. Esto nos permitirá garantizar la seguridad de tus datos y facilitará la recuperación de tu contraseña en el futuro.

<LINK>

¡Disfruta de la aplicación!
El equipo de ${__APP_TITLE__}`

    const subject_pl = `Witaj w ${__APP_TITLE__}!`
    const subject_en = `Welcome to ${__APP_TITLE__}!`
    const subject_es = `¡Bienvenido a ${__APP_TITLE__}!`

    async function create_user_in_public_tenant(tenant,
                                                app_id,
                                                tenant_name,
                                                username,
                                                password,
                                                firstname,
                                                phone,
                                                client_id,
                                                captcha_token,
                                                redirect,
                                                state,
                                                dont_create_app_user,
                                                access_details)
    {
        if(!tenant_name)
            tenant_name = "My group";

        let additionalData = ''
        if(phone)
        {
            additionalData = JSON.stringify({
                phone: phone,
                org_name: tenant_name
            })
        }

        const config = $session.configuration

        const body = {
            username : username,
            password : password,
            firstname: firstname,
            client_id : client_id,
            app_id : app_id,
            tenant : tenant,
            org_name: tenant_name,
            captcha: captcha_token,
            //redirect_uri: dont_create_app_user ? '' : redirect_uri,     // na razie tak, może przydałby się jakis parametr
            //state: state,
            additional_data: additionalData,
            dont_create_app_user: dont_create_app_user,
            access_details: access_details,
            own_confirmation_page: true,
            
            state: '',
            redirect_uri: __WEBSITE__ + '/#/confirmemail',
            email_subject: i18n({en: subject_en, es: subject_es, pl: subject_pl}),
            email_content: i18n({en: content_en, es: content_es, pl: content_pl}),
            email_from: __APP_TITLE__ + ' <noreply@objectreef.dev>'
        }

        
        try {
            let host;
            if(dont_create_app_user)
                host = config.iss
            else
                host = get_issuer_at_tenant(tenant, config.iss)
        
            const  res = await fetch(  host + "/dev/add-to-public-tenant",
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

    async function create_new_user_and_tenant(   app_id,
                                                tenant_name,
                                                username,
                                                password,
                                                firstname,
                                                phone,
                                                client_id,
                                                captcha_token,
                                                redirect,
                                                state,
                                                dont_create_app_user,
                                                access_details)
    {
        if(!tenant_name)
            tenant_name = "My account";

        const body = {
            username : username,
            password : password,
            firstname: firstname,
            client_id : client_id,
            app_id : app_id,
            tenant : tenant_name,
            captcha: captcha_token,
            //redirect_uri: redirect,
            state: state
        }

        const config = $session.configuration

            try {
                const  res = await fetch(  config.iss + "/dev/create-app-account",
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

    async function signin_and_redirect_to_app(e)
    {
        await signin(username, password)
    }

    function get_issuer_at_tenant(tid, iss)
    {   
        const url = new URL(iss);
        url.host = `${tid}.${url.host}`;
        return url.toString().replace(/\/$/, "");
    }


    async function signin(username, password)
    {
        if(!username)
            return;

        if(!password)
            return;

        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("client_id",    config.client_id);
        data.append("grant_type",   "password");
        data.append("scope",        config.scope)
        data.append("username",     username);
        data.append("password",     password)
        //long_term_refresh

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
                username = ''
                password = ''
                let tokens = await res.json()

                let redirect_to = ''
                switch($session.useTokensToSignIn(tokens))
                {
                case Session.SIGNIN_SUCCESS:
                    redirect_to = redirect ? redirect : '/';
                    break;

                case Session.SIGNIN_CHOOSE_TENANT:
                    redirect_to = '#/auth/choose-tenant?redirect=' + encodeURIComponent(redirect);
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

    function back(e)
    {
        error_message = ''
        switch(phase)
        {
        case PHASE_ASK_EMAIL_ADDRESS:
            return check_email_address_and_go_forward(e)
            
        case PHASE_USER_EXISTS__ASK_PASSWORD:
            phase = PHASE_ASK_EMAIL_ADDRESS
            return
            
        case PHASE_SETUP_PASSWORD:
            phase = PHASE_ASK_EMAIL_ADDRESS
            return

        case PHASE_ASK_ADDITIONAL_INFO:
            phase = has_user ? PHASE_USER_EXISTS__ASK_PASSWORD : PHASE_SETUP_PASSWORD
            return
        }
    }

    function error(msg)
    {
        push(`/result?msg=${encodeURIComponent(msg)}`) 
        return false
    }

    function reset_password(e)
    {
        let redirect_to = '/resetpassword'
        if(username)
            redirect_to += '?username=' + encodeURIComponent(username)
        push(redirect_to)
    }

    async function get_google_signup_state()
    {
        const config = $session.configuration

        const code_verifier = $session.push_code_verifier()
        const code_challenge = await $session.get_code_challenge(code_verifier)

        const gstate = {
                client_id: config.client_id,
                redirect_uri: `${__WEBSITE__}/#/signupgoogle`,
                code_challenge: code_challenge,
                scope: config.scope,
                state: '',
                tenant: config.tenant,
                force_new_space: true,
                groups_only: config.groups_only,
                own_invitation_page: true
            }

        return JSON.stringify(gstate)
    }

    function get_google_callback()
    {
        const config = $session.configuration
        
        // tmp
        //return 'https://localhost:1997/auth/authorize_with_google'
        
        return `${config.iss}/auth/authorize_with_google`
    }
   
    const title = '_; Sign up; Regístrate; Zarejestruj się'
   
</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
    <script src="https://accounts.google.com/gsi/client" async></script>
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
                        {#if phase == PHASE_ASK_EMAIL_ADDRESS}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                                <p>
                                    _;
                                    Enter the email address you'll use to sign in;
                                    Introduce la dirección de correo electrónico que vas a utilizar para iniciar sesión;
                                    Podaj swój adres e-mail, który będziesz używać do logowania
                                </p>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Email address; Dirección de correo electrónico; Adres e-mail</h4>
                                    <input type="email" required autocomplete="username" autofocus bind:value={username} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                </div >
                                
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
                                            on:click={validate_current_step}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>

                                <!-- signin with google -->
                                {#if true}
                                    
                                    <hr/>

                                    {#await get_google_signup_state() then gstate}
                                        <div id="g_id_onload"
                                            data-client_id="543114490747-i9oj1j9kt1slk7dvavjo9f1uqrp9i0a0.apps.googleusercontent.com"
                                            data-context="use"
                                            data-ux_mode="redirect"
                                            data-login_uri={get_google_callback()}
                                            data-auto_prompt="false">
                                        </div>

                                        <!-- data-theme="filled_black" -->
                                        <div class="g_id_signin"
                                            data-type="standard"
                                            data-shape="rectangular"
                                            data-theme={$dark_mode_store ? "filled_black" : "outline"} 
                                            data-text="signup_with" 
                                            data-size="large"
                                            data-logo_alignment="left"
                                            data-state={gstate}>
                                        </div>
                                    {/await}
                                {/if}

                                
                            </h4>
                        {:else if phase == PHASE_USER_EXISTS__ASK_PASSWORD}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                                <p>
                                    _;
                                    A user with this email address already exists. Please enter your password or reset it by sending a special message to your email address.;
                                    Ya existe un usuario con esta dirección de correo electrónico. Introduce tu contraseña o restablecela enviando un mensaje especial a tu dirección de correo electrónico.;
                                    Użytkownik o podanym adresie e-mail już istnieje. Podaj swoje hasło lub ustaw je ponownie przez wysłanie specjalnej wiadomości na twoją skrzynkę mailową 
                                </p>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Password; Contraseña; Hasło</h4>
                                    <p class="flex flex-row">
                                        <input type="password" required autocomplete="current-password" autofocus name="password" bind:value={password} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </p>
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

                                    <button class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-800
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-700
                                            "
                                            tabindex="0"
                                            on:click={back}> 
                                            _; Back; Atrás; Wstecz
                                    </button>

                                    <button class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-800
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-700
                                            "
                                            tabindex="0"
                                            on:click={reset_password}> 
                                            _; Reset password; Restablecer contraseña; Zresetuj hasło
                                    </button>
                                    
                                    <button  type="submit"
                                            class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-700
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-600
                                            "
                                            tabindex="0"
                                            on:click={validate_current_step}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>
                            </h4>
                        {:else if phase == PHASE_USER_ALREADY_REGISTERED}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                                <p>
                                    {i18n({
                                        en: `You already have an account on ${__APP_TITLE__}. Click the button below to go to the app. If you need a new group, you can create one from the settings menu`,
                                        es: `Ya tienes una cuenta en ${__APP_TITLE__}. Haz clic en el botón de abajo para acceder a la aplicación. Si necesitas un nuevo grupo, puedes crearlo desde el menú de ajustes.`,
                                        pl: `Masz już konto w ${__APP_TITLE__}. Kliknij w poniższy przycisk aby przejść do aplikacji. Jeśli potrzebujesz nowej grupy możesz ją stworzyć z poziomu menu ustawień`
                                    })}
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
                                            class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-700
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-600
                                            "
                                            tabindex="0"
                                            on:click={validate_current_step}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>
                            </h4>
                        {:else if phase == PHASE_SETUP_PASSWORD}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
                                <p>
                                    _;
                                    Before you access the application for the first time, you must set a password that you will use to sign in.;
                                    Antes de acceder a la aplicación por primera vez, debe establecer una contraseña que utilizará para iniciar sesión.;
                                    Przed pierwszym użyciem aplikacji musisz ustawić hasło, którego będziesz używać do logowania
                                </p>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; New password; Nueva contraseña; Nowe hasło</h4>
                                    <p class="flex flex-row">
                                        <input type="password" required autocomplete="new-password" autofocus name="password" bind:value={password} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </p>
                                </div>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Repeat password; Repita la contraseña; Powtórz hasło</h4>
                                    <p class="flex flex-row">
                                        <input type="password" required  name="password2" bind:value={password_2} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </p>
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
                                            bg-stone-100 dark:bg-stone-800
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-700
                                            "
                                            tabindex="0"
                                            on:click={back}> 
                                            _; Back; Atrás; Wstecz
                                    </button>
                                    
                                    <button  type="submit"
                                            class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-700
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-600
                                            "
                                            tabindex="0"
                                            on:click={validate_current_step}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>
                            </h4>
                        {:else if phase == PHASE_ASK_ADDITIONAL_INFO}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow">
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

                                {#if ask_name}
                                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                        <h4>_; Your name; Tu nombre; Twoje imię</h4>
                                        <input type="text" autocomplete="name" bind:value={firstname} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </div>
                                {/if}

                                {#if ask_phone}
                                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                        <h4>_; Your phone number; Tu número de teléfono; Twój numer telefonu</h4>
                                        <input type="tel" autocomplete="tel" bind:value={phone} on:keydown={keydown} tabindex="0"
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
                                            bg-stone-100 dark:bg-stone-800
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-700
                                            "
                                            tabindex="0"
                                            on:click={back}> 
                                            _; Back; Atrás; Wstecz
                                    </button>
                                    
                                    <button  type="submit"
                                            class="px-4 mx-2
                                            bg-stone-100 dark:bg-stone-700
                                            outline outline-offset-2 outline-2
                                            outline-stone-200 dark:outline-stone-500
                                            focus:outline-stone-300 dark:focus:outline-stone-400
                                            hover:bg-stone-200 hover:dark:bg-stone-600
                                            "
                                            tabindex="0"
                                            on:click={validate_current_step}> 
                                            _; Continue; Iniciar Continuar; Kontynuuj
                                    </button>
                                </div>
                            </h4>
                        {:else if phase == PHASE_REGISTERING}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow ">
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