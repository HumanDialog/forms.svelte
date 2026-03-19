<script>
    import Header from '../landing/header.svelte'
    import Footer from '../landing/footer.svelte';
    import {wholeAppReloader, i18n, dark_mode_store} from '$lib'
	import { onMount, tick } from 'svelte';
	import { session, reef, Session } from '@humandialog/auth.svelte';
    import {location, push, querystring} from 'svelte-spa-router'
    

    let username = ''
    let error_message = ''
    
    $: switchBodyClass($dark_mode_store);
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
            submit(e)   
        }
    }

    const content_pl = `Cześć!

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w serwisie ${__APP_TITLE__}.

Aby ustawić nowe hasło, kliknij w poniższy link lub skopiuj go i wklej w pasek adresu przeglądarki:

<LINK>

Jeśli to nie Ty wysłałeś prośbę o zresetowanie hasła, możesz zignorować tę wiadomość. Twoje obecne hasło pozostanie bezpieczne i nie zostanie zmienione.

W razie jakichkolwiek pytań, skontaktuj się z naszym działem wsparcia pod adresem: ${__WEBSITE__}/#/contact.

Pozdrawiamy,
Zespół ${__APP_TITLE__}`

    const content_en = `Hello!

We have received a request to reset the password for your account on ${__APP_TITLE__}.

To set a new password, click on the link below or copy and paste it into your browser's address bar:

<LINK>

If you did not request a password reset, you can ignore this message. Your current password will remain secure and will not be changed.

If you have any questions, contact our support team at: ${__WEBSITE__}/#/contact.

Best regards,
The ${__APP_TITLE__} Team`

    const content_es = `¡Hola!

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en ${__APP_TITLE__}.

Para establecer una nueva contraseña, haz clic en el siguiente enlace o cópialo y pégalo en la barra de direcciones del navegador:

<LINK>

Si no has enviado tú la solicitud de restablecimiento de contraseña, puedes ignorar este mensaje. Tu contraseña actual seguirá siendo segura y no se modificará.

Si tienes alguna pregunta, ponte en contacto con nuestro servicio de asistencia en: ${__WEBSITE__}/#/contact.

Saludos cordiales,
El equipo de ${__APP_TITLE__}`

    async function submit(e)
    {
        // todo validation
        if(!username)
            return;

        error_message = ''

        const config = $session.configuration

        const subject = '_; Set a new password; Establecer una nueva contraseña; Ustaw nowe hasło'
        const content = i18n({en: content_en, es: content_es, pl: content_pl})
        const from = __APP_TITLE__ + ' <noreply@objectreef.dev>'     // todo
        const redirect_uri = __WEBSITE__ + '/#/changepassword'
        const state = ''


        let data = new URLSearchParams();
        data.append("client_id",    config.client_id);
        data.append("username",     username);
        data.append("email_subject", subject);
        data.append("email_content", content);
        data.append("email_from",    from);
        data.append("redirect_uri", redirect_uri);
        data.append("state",        state);

        try {
            const res = await fetch(`${config.iss}/auth/resetpasswordprivate`,
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
                username = ''
                
                const msg = `_; 
                            Check your email. If a user with the specified email address exists, a message with a link to set a new password has been sent.;
                            Comprueba tu correo electrónico. Si el usuario con la dirección de correo electrónico proporcionada existe, se le ha enviado un mensaje con un enlace para establecer una nueva contraseña.;
                            Sprawdź skrzynkę e-mail. Jeśli użytkownik o podanym adresie e-mail istnieje Wiadomość z linkiem do ustawienia nowego hasła została wysłana.`
                
                push(`/result?status_code=${res.status}&msg=${encodeURIComponent(msg)}`)   
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

    const title = '_; Password reset; Restablecimiento de contraseña; Resetowanie hasła'

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


                        <!-------------------------------------------------------------------->
                        <!-- POPUP CONTENT---------------------------------------------------->
                        <!-------------------------------------------------------------------->
                        <div class="grow">
                        
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
                                        on:click={submit}> 
                                        _; Reset; Restablecer; Resetuj
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