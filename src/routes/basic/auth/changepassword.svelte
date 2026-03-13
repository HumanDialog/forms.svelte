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
    let redirect_uri = __WEBSITE__ + '/#/changepassword'

    let new_user_setup = false

    let message = ''

    const PHASE_VALIDATION = 0
    const PHASE_ERROR = 1
    const PHASE_ALLOW_PASSWORD_SET = 2
    const PHASE_PASSWORD_CHANGED  = 3

    let phase = PHASE_VALIDATION

    let new_password = ''
    let new_password_2 = ''

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


        new_user_setup = params.has("new_user_setup")
        
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
             if(new_user_setup)
            {
                phase = PHASE_ALLOW_PASSWORD_SET
                redirect_uri = ''   
            }
            else
            {
                phase = PHASE_VALIDATION
                await check_validation_token()
            }
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

    

    function keydown(e)
    {
        if(e.key == 'Enter')
        {
            e.preventDefault()
            e.stopPropagation()
            change_password(e)   
        }
    }

    async function check_validation_token()
    {
        message = ''

        const config = $session.configuration

        let data = new URLSearchParams();
        data.append("username",     username);
        data.append("redirect_uri", redirect_uri);
        data.append("state",        state);
        data.append("validation_token", validation_token);

        try {
            const res = await fetch(`${config.iss}/auth/checkvalidationtoken`,
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
                if(result.valid)
                {
                    phase = PHASE_ALLOW_PASSWORD_SET
                }
                else
                {
                    message = `_;
                              The link is no longer active. It has probably already been used.;
                              El enlace ya no está activo. Probablemente ya se haya utilizado.;
                              Odnośnik nie jest już aktywny. Prawdopodobnie został już użyty.`
                    phase = PHASE_ERROR
                }
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


    function reset_password_again(e)
    {
        push('/resetpassword')
    }

    function go_to_main_page(e)
    {
        push('/')
    }

    function sign_in(e)
    {
        push('/signin')
    }

    async function change_password(e)
    {
        message = ''

        if(new_password.length < 4)
        {
            message = "_; Use at least 4 characters; Utilice al menos 4 caracteres; Użyj co najmniej 4 znaków";
            return;
        }

        if(new_password != new_password_2)
        {
            message = "_; Passwords are different; Las contraseñas son diferentes; Hasła są różne";
            return;
        }

        const config = $session.configuration

        lock_buttons = true;

        let data = new URLSearchParams();
        data.append("username", username);
        data.append("password", new_password);
        data.append("redirect_uri", redirect_uri);
        data.append("state", state);
        data.append("validation_token", validation_token);


        try {
            const res = await fetch(`${config.iss}/auth/change_password`,
                                {
                                    method: 'post',
                                    headers: new Headers({
                                        'Authorization': 'Basic '+btoa(`${config.client_id}:${config.client_secret}`),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'Accept': 'application/json'
                                    }),
                                    body: data
                                })

            if (!res.ok) 
            {
                const result = await res.json();    
                message = (!!result.error_description) ? result.error_description : "";

                if(!message)
                    message = "_; Unable to change password; No se ha podido cambiar la contraseña; Nie udało się zmienić hasła"

                phase = PHASE_ERROR
            }
            else
            {
               phase = PHASE_PASSWORD_CHANGED
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

        lock_buttons = false;
    }

    const title = '_; Change password; Cambiar contraseña; Zmień hasło'

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
        <div class="mb-40" aria-labelledby="modal-title" role="dialog" aria-modal="true" >
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
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                            
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
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                            
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
                                        on:click={reset_password_again}> 
                                        _; Reset your password again; Reiniciar el restablecimiento de contraseña; Ponów resetowanie hasła
                                </button>

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

                        {:else if phase == PHASE_ALLOW_PASSWORD_SET}

                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">

                                {#if new_user_setup}
                                <p>
                                    _;
                                    Before you access the application for the first time, you must set a password that you will use to sign in.;
                                    Antes de acceder a la aplicación por primera vez, debe establecer una contraseña que utilizará para iniciar sesión.;
                                    Przed pierwszym użyciem aplikacji musisz ustawić hasło, którego będziesz używać do logowania
                                </p>
                                {/if}
                            
                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; New password; Nueva contraseña; Nowe hasło</h4>
                                    <p class="flex flex-row">
                                        <input type="password" required autocomplete="new-password" name="password" bind:value={new_password} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </p>
                                </div>

                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Repeat password; Repita la contraseña; Powtórz hasło</h4>
                                    <p class="flex flex-row">
                                        <input type="password" required  name="password2" bind:value={new_password_2} on:keydown={keydown} tabindex="0"
                                            class="w-full border-0 focus:outline-none bg-stone-100 dark:bg-stone-800"/>
                                    </p>
                                </div>

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
                                        bg-stone-100 dark:bg-stone-700
                                        outline outline-offset-2 outline-2
                                        outline-stone-200 dark:outline-stone-500
                                        focus:outline-stone-300 dark:focus:outline-stone-400
                                        hover:bg-stone-200 hover:dark:bg-stone-600
                                        "
                                        tabindex="0"
                                        on:click={change_password}
                                        disabled={lock_buttons}> 
                                        _; Set password; Establecer contraseña; Ustaw hasło
                                </button>
                            </div>
                            </h4>

                        {:else if phase == PHASE_PASSWORD_CHANGED}
                            <!-------------------------------------------------------------------->
                            <!-- POPUP CONTENT---------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
                            
                                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                                    <h4>_; Success; Éxito; Sukces</h4>
                                    {#if new_user_setup}
                                        <p class="flex flex-row">
                                            _;
                                            Your password has been set. You can now sign in to the application.;
                                            Tu contraseña ha sido configurada. Ahora puedes iniciar sesión en la aplicación.;
                                            Twoje hasło zostało ustawione. Teraz możesz się zalogować do aplikacji. 
                                        </p>
                                    {:else}
                                        <p class="flex flex-row">
                                            _;
                                            Your password has been changed. You can now sign in to the application using your new password.;
                                            Tu contraseña ha sido cambiada. Ahora puedes iniciar sesión en la aplicación con la nueva contraseña.;
                                            Twoje hasło zostało zmienione. Teraz możesz się zalogować do aplikacji używając nowego hasła. 
                                        </p>
                                    {/if}
                                </div >
                            </div>
                            

                            <!-------------------------------------------------------------------->
                            <!-- POPUP FOOTER----------------------------------------------------->
                            <!-------------------------------------------------------------------->
                            <h4 class = "flex-none">
                                <div class="flex flex-row justify-end gap-2">

                                <button  type="submit"
                                        class="px-4 my-2
                                        bg-stone-100 dark:bg-stone-700
                                        outline outline-offset-2 outline-2
                                        outline-stone-200 dark:outline-stone-500
                                        focus:outline-stone-300 dark:focus:outline-stone-400
                                        hover:bg-stone-200 hover:dark:bg-stone-600
                                        "
                                        tabindex="0"
                                        on:click={sign_in}> 
                                        _; Sign in; Iniciar sesión; Zaloguj się
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