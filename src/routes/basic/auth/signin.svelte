<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    

    let redirect = '/'

    let username = ''
    let password = ''
    let error_message = ''

    $: switchBodyClass($dark_mode_store);
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

    

    function keydown(e)
    {
        if(e.key == 'Enter')
        {
            e.preventDefault()
            e.stopPropagation()
            signin(e)   
        }
    }

    async function signin(e)
    {
        // todo validation
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
                    redirect_to = redirect;
                    break;

                case Session.SIGNIN_CHOOSE_TENANT:
                    redirect_to = '/#/auth/choose-tenant?redirect=' + encodeURIComponent(redirect);
                    break;

                case Session.SIGNIN_FAILED:
                    error_message = 'Something wrong with tokens'
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
                if(result && result.error == "access_denied")
                {
                    error_message = '_; Invalid email or password; Correo electrónico o contraseña no válidos; Nieprawidłowy adres e-mail lub hasło'
                }
                else if(result && result.error == "invalid_user")
                {
                    // todo: user istnieje, ale nie ma konta w danej aplikacji. Czy pokazać komunikat, żeby się zarejestrował?
                    error_message = '_; Invalid email or password; Correo electrónico o contraseña no válidos; Nieprawidłowy adres e-mail lub hasło'
                }
                else
                {
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
        }
        catch(err)
        {
            console.error(err)
            error_message = "_; Cannot connect to service; No se puede conectar al servicio; Nie można połączyć się z usługą"
        }

            
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
                redirect_uri: `${__WEBSITE__}/#/auth/cb`,
                code_challenge: code_challenge,
                scope: config.scope,
                state: redirect,
                tenant: config.tenant,
                force_new_space: false,
                groups_only: config.groups_only
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

    const title = '_; Sign in; Iniciar sesión; Logowanie'

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
    <script src="https://accounts.google.com/gsi/client" async></script>
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
                        <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                        
                            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                <h4>_; Email address; Dirección de correo electrónico; Adres e-mail</h4>
                                <input type="email" required autocomplete="username" autofocus bind:value={username} on:keydown={keydown} tabindex="0"
                                        class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                            </div >
                            
                            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                <h4>_; Password; Contraseña; Hasło</h4>
                                <p class="flex flex-row">
                                    <input type="password" required autocomplete="current-password" name="password" bind:value={password} on:keydown={keydown} tabindex="0"
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
                                        on:click={signin}> 
                                        _; Sign in; Iniciar sesión; Zaloguj
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
                                        data-text="signin_with"
                                        data-size="large"
                                        data-logo_alignment="left"
                                        data-state={gstate}>
                                    </div>
                                {/await}

                            {/if}

                            
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