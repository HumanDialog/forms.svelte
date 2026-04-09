<script>
    import {afterUpdate, onMount, tick} from 'svelte'
    import Dialog from './dialog.svelte'
    import {clearActiveItem, isDeviceSmallerThan, startEditing, editable, isValidEmail, randomString} from './utils.js'
    import Icon from './components/icon.svelte'
    import {FaTimes} from 'svelte-icons/fa'
    import {i18n} from './i18n'
	import { reef, session } from '@humandialog/auth.svelte';
	import { onErrorShowAlert } from './stores';
    import EditableParagraph from './components/prose.editable.p.svelte'
    import EditableSpan from './components/prose.editable.span.svelte'
    import Ricon from './components/r.icon.svelte'

    export let nameAttrib = "Name";
    export let emailAttrib = "login";
    export let refAttrib = "$ref";
    export let hrefAttrib = ''

    export let onNewUserAdded = undefined
    export let ownInvitation = ''

    //$: initData()

    async function initData(...args)
    {
        await reloadData()
    }

    let authAccessKinds = []
    let appRoles = []
  
    let invitingUser = null
    let invitingIdentifier = ''
    let groupName = ''
    let subject = ''
    let content = ''

    let emailIsInvalid = false
    let email = ''
    let name = ''
    let selectedAccessKey = 0
    let selectedAppRole = ''
    let silently = false
    let accepted = false

    let showAccessRoles = false

    let inviteUserIdempotencyToken = ''
    

    let rootDialog;
    export function show(parameters)
    {
        authAccessKinds = parameters.authAccessKinds
        selectedAccessKey = authAccessKinds[0].key
        
        appRoles = parameters.appRoles
        selectedAppRole = appRoles[0].name
        showAccessRoles = appRoles.length > 0

        emailIsInvalid = false
        email = parameters.email ?? ''
        name = parameters.name ?? ''
        silently = parameters.silently ?? false
        accepted = parameters.accepted ?? false

        inviteUserIdempotencyToken = randomString(8);

        //elementLink = paramElement
        initData().then((res) => rootDialog.show())
        
    }

    async function reloadData()
    {   
        const tInfo = $session.tenants.find((t) => t.id == $session.tid)
        if(tInfo)
            groupName = tInfo.name

        // ================================

        let userFields = ''
        if(nameAttrib)
            userFields += (userFields ? ',' : '') + nameAttrib

        if(emailAttrib)
            userFields += (userFields ? ',' : '') + emailAttrib

        if(refAttrib)
            userFields += (userFields ? ',' : '') + refAttrib

        if(hrefAttrib)
            userFields += (userFields ? ',' : '') + hrefAttrib
        
        const userResponse = reef.get(`user?fields=${userFields}`, onErrorShowAlert)
        const appInfoResponse = reef.getAppInstanceInfo(onErrorShowAlert)

        const requestResults = await Promise.all([userResponse, appInfoResponse])

        invitingUser = requestResults[0].User
        const appInfo = requestResults[1]

        // ================================

        subject = i18n({en: 'Invitation to', es: 'Invitación a', pl: 'Zaproszenie do'})
        subject += ' ' + groupName

        // ================================

        let invitingName
        if(invitingUser[nameAttrib])
        {
            invitingIdentifier = invitingUser[nameAttrib]
            invitingName = invitingIdentifier
        }
        else
        {
            invitingIdentifier = invitingUser[emailAttrib]
            invitingName = i18n({
                en: `A user ${invitingIdentifier}`,
                es: `Un usuario ${invitingIdentifier}`,
                pl: `Użytkownik ${invitingIdentifier}`
            })
        }

        let appName = ''
        if(appInfo && appInfo.app && appInfo.app.name)
        {
            appName = i18n({
                en: ` at ${appInfo.app.name}`,
                es: ` en ${appInfo.app.name}`,
                pl: ` w serwisie ${appInfo.app.name}`
            })
        }
        
        content = i18n({
            en: `Hello!
${invitingName} has invited you to join ${groupName} group${appName}.
Please follow the link below to accept the invitation:`,

            es: `¡Hola!
${invitingName} te ha invitado a unirte al grupo ${groupName}${appName}.
Sigue el enlace siguiente para aceptar la invitación:`,

            pl: `Witaj!
${invitingName} zaprosił(a) Cię do grupy ${groupName}${appName}.
Aby zaakceptować zaproszenie, kliknij poniższy link:`
        })
    }

    let rootElement;
    let prevHeight = 0
    let closeButtonPos = ''
    afterUpdate( () =>
    {
        if(rootElement)
        {
            const myRect = rootElement.getBoundingClientRect()
            if(myRect.height != prevHeight)
                prevHeight = myRect.height
            
            //closeButtonPos = `top: calc(${myRect.top}px - 2.25rem); left: calc(${myRect.right}px - 1rem)`
            if(isDeviceSmallerThan('sm'))
                closeButtonPos = `top: calc(${myRect.top}px - 0.25rem); left: calc(${myRect.right}px - 1.25rem)`
            else
                closeButtonPos = `top: -0.25rem; left: calc(${myRect.width}px - 1.25rem)`
        }
    })


    function clearSelection(e)
    {
        clearActiveItem('handy')
    }

    onMount( () => {
        // clear selection when shown
        clearActiveItem('handy')
    })

    function closeDialog(e)
    {
        rootDialog.hide()
    }

    let emailElement
    let nameElement
    let subjectElement
    let contentElement

    let creating_semaphore = false

    async function invite(e)
    {
        let isValid = true
        isValid = emailElement.validate()    && isValid
        isValid = nameElement.validate()     && isValid
        isValid = subjectElement.validate()  && isValid
        isValid = contentElement.validate()  && isValid

        if(!isValid)
        {
            console.log('invalid input')
        }
        else
        {
            if(creating_semaphore)
                return

            creating_semaphore = true

            email = emailElement.getValue().trim()
            name = nameElement.getValue().trim()
            subject = subjectElement.getValue().trim()
            content = contentElement.getValue().trim()

            let redirect_uri = ''
            let state = ''
            let own_invitation_page = false
            if(ownInvitation)
            {
                redirect_uri = ownInvitation
                own_invitation_page = true
            }
            else
            {
                redirect_uri = `${window.location.origin}/#/auth/cb`
                state = `${window.location.origin}/#/auth/signin`
            }
            
            try {
                const res = await reef.fetch('/json/anyv/sys/invite_user', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: email,
                                auth_group: selectedAccessKey,
                                //files_group: new_user.files_group,
                                role: selectedAppRole,
                                client_id: $session.configuration.client_id,
                                redirect_uri: redirect_uri,
                                state: state,
                                own_invitation_page: own_invitation_page,
                            //    idempotency_token: inviteUserIdempotencyToken,
                                silently: silently,
                                accepted: accepted,
                                subject: subject,
                                content: content,
                                set:
                                {
                                    [nameAttrib]: name,
                                    [emailAttrib]: email
                                }
                            })
                        })

                if(res.ok)
                {
                    const result = await res.json();
                    let created_user = result.User;

                    if(onNewUserAdded)
                        onNewUserAdded(created_user)
                }
                else
                {
                    const err_msg = await res.text();
                    onErrorShowAlert(err_msg);
                }
            }
            catch(err)
            {
                onErrorShowAlert(err);
            }

            creating_semaphore = false


            rootDialog.hide()
        }
    }

    async function copyInvitation(e)
    {
        let isValid = true
        isValid = emailElement.validate()    && isValid
        isValid = nameElement.validate()     && isValid
        isValid = subjectElement.validate()  && isValid
        isValid = contentElement.validate()  && isValid

        if(!isValid)
        {
            console.log('invalid input')
        }
        else
        {
            if(creating_semaphore)
                return

            creating_semaphore = true

            email = emailElement.getValue().trim()
            name = nameElement.getValue().trim()
            subject = subjectElement.getValue().trim()
            content = contentElement.getValue().trim()

            let redirect_uri = ''
            let state = ''
            let own_invitation_page = false
            if(ownInvitation)
            {
                redirect_uri = ownInvitation
                own_invitation_page = true
            }
            else
            {
                redirect_uri = `${window.location.origin}/#/auth/cb`
                state = `${window.location.origin}/#/auth/signin`
            }
            
            try {
                const res = await reef.fetch('/json/anyv/sys/invite_user', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: email,
                                auth_group: selectedAccessKey,
                                //files_group: new_user.files_group,
                                role: selectedAppRole,
                                client_id: $session.configuration.client_id,
                                redirect_uri: redirect_uri,
                                state: state,
                                own_invitation_page: own_invitation_page,
                            //    idempotency_token: inviteUserIdempotencyToken,
                                silently: true,
                                accepted: accepted,
                                set:
                                {
                                    [nameAttrib]: name,
                                    [emailAttrib]: email
                                }
                            })
                        })

                if(res.ok)
                {
                    const result = await res.json();
                    let created_user = result.User;

                    if(onNewUserAdded)
                        onNewUserAdded(created_user)


                    let params = `username=${email}`
                    params += `&client_id=${$session.configuration.client_id}`
                    params += `&redirect_uri=${encodeURIComponent(redirect_uri)}`
                    params += `&state=${encodeURIComponent(state)}`
                    params += `&tenant=${$session.tid}`
                    params += `&scope=${$session.appId}`
                    if(own_invitation_page)
                        params += '&own_invitation_page=true' 


                    const res2 = await reef.fetch(`/auth/regenerate_invitation_link?${params}`)

                    if(res2.ok)
                    {
                        const result = await res2.json();
                        console.log(result.invitation_link)

                        let wholeMessage = `${subject}\n\n${content}\n${result.invitation_link}\n`
                        navigator.clipboard.writeText(wholeMessage)
                    }
                    else
                    {
                        const err_msg = await res2.text();
                        onErrorShowAlert(err_msg);
                    }
                }
                else
                {
                    const err_msg = await res.text();
                    onErrorShowAlert(err_msg);
                }
            }
            catch(err)
            {
                onErrorShowAlert(err);
            }

            creating_semaphore = false


            rootDialog.hide()
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

<Dialog bind:this={rootDialog}>
    <div bind:this={rootElement} on:click={clearSelection}
        class="paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                m-0 pt-5 pb-5 px-1 sm:px-8
                sm:rounded
                bg-stone-200 dark:bg-stone-900
                flex flex-col" >

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
                    <span class="text-left">{i18n({ en: 'Invitation', es: 'Invitación', pl: 'Zaproszenie'})}</span>
                </div>
                <div class="py-1.5  flex flex-row justify-between">
                    <button class="ml-4 w-6
                                hover:bg-stone-200 hover:dark:bg-stone-700
                                hover:outline hover:outline-8
                                hover:outline-stone-200 hover:dark:outline-stone-700"
                                on:click={ closeDialog }>
                        <Ricon icon = 'x' />
                    </button>
                </div>
            </div>
        </h3>
        
        

        <!-------------------------------------------------------------------->
        <!-- POPUP CONTENT---------------------------------------------------->
        <!-------------------------------------------------------------------->
        <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>E-mail</h4>
                <EditableParagraph bind:this={emailElement}
                    val={email}
                    validation={isValidEmail}
                    tooltip="E-mail"
                    placeholder={i18n({
                                        en: 'Enter the email address',
                                        es: 'Introduce la dirección de correo electrónico',
                                        pl: 'Wprowadź adres e-mail zapraszanej osoby'
                                    })}
                />
            </div>

            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>{i18n({en: 'Name', es: 'Nombre', pl: 'Imię'})}</h4>
                <EditableParagraph bind:this={nameElement}
                    val={name}
                    placeholder={i18n({
                                        en: 'Enter the name of the person you are inviting',
                                        es: 'Introduce el nombre de la persona invitada',
                                        pl: 'Wprowadź imię zapraszanej osoby'
                                    })}
                />
            </div>

            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4><h4>{i18n({en: 'Inviting', es: 'Invitante', pl: 'Zapraszający'})}</h4></h4>
                <p>{invitingIdentifier}</p>
            </div>

            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>{i18n({en: 'Invitation subject', es: 'Asunto de la invitación', pl: 'Temat zaproszenia'})}</h4>
                <EditableParagraph bind:this={subjectElement}
                    val={subject}
                    required
                    tooltip={i18n({
                                        en: 'Click to edit',
                                        es: 'Haga clic para editar',
                                        pl: 'Kliknij, aby edytować'
                                    })}
                />
            </div>



             <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>{i18n({en: 'Invitation content', es: 'Contenido de la invitación', pl: 'Treść zaproszenia'})}</h4>
                <p> 
                    <EditableSpan   bind:this={contentElement}
                                    class="text-wrap break-words whitespace-pre-wrap"
                                    val={content}
                                    required
                                    multiline
                                    tooltip={i18n({
                                        en: 'Click to edit',
                                        es: 'Haga clic para editar',
                                        pl: 'Kliknij, aby edytować'
                                    })}/>

                    <span class="uppercase text-sm text-zinc-600 dark:text-zinc-400">
                        <br>
                        &lt;{i18n({en: 'Unique invitation link', es: 'Enlace único de invitación', pl: 'Unikalny link zapraszający'})}&gt;
                    </span>
                </p>
            </div>



            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>{i18n({en: 'Permissions management', es: 'Gestión de permisos', pl: 'Zarządzanie uprawnieniami'})}</h4>
                <p class="flex flex-row">
                    {#each authAccessKinds as kind}
                        {@const isActive = selectedAccessKey == kind.key}
                        <button class="text-sm px-2 mx-1
                                    text-stone-700 dark:text-stone-300 dark:hover:text-white
                                    hover:bg-stone-200 dark:hover:bg-stone-700
                                    border border-stone-300 focus:outline-none dark:border-stone-600
                                    flex items-center rounded"
                                    class:bg-stone-200={isActive}
                                    class:dark:bg-stone-700={isActive}
                                    class:dark:text-white={isActive}
                                    disabled={isActive}
                                    on:click={(e)=> selectedAccessKey=kind.key}>
                            {kind.name}
                        </button>
                    {/each}
                </p>
            </div>

            {#if showAccessRoles}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                    <h4>{i18n({en: 'Role in the application', es: 'Papel en la aplicación', pl: 'Rola w aplikacji'})}</h4>
                    <p class="flex flex-row">
                        {#each appRoles as role}
                            {@const isActive = selectedAppRole == role.name}
                            <button class="text-sm px-2 mx-1
                                        text-stone-700 dark:text-stone-300 dark:hover:text-white
                                        hover:bg-stone-200 dark:hover:bg-stone-700
                                        border border-stone-300 focus:outline-none dark:border-stone-600
                                        flex items-center rounded"
                                        class:bg-stone-200={isActive}
                                        class:dark:bg-stone-700={isActive}
                                        class:dark:text-white={isActive}
                                        disabled={isActive}
                                        on:click={(e)=> selectedAppRole=role.name}>
                                {role.summary}
                            </button>
                        {/each}
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
                            bg-stone-100 dark:bg-stone-700
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700"
                        on:click={invite}> 
                        {i18n({ en: 'Invite', es: 'Invitar', pl: 'Zaproś'})}
                </button>

                <button class="px-4 mx-2
                            bg-stone-100 dark:bg-stone-700
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700"
                        on:click={copyInvitation}>
                        {i18n({ en: 'Copy invitation', es: 'Copiar invitación', pl: 'Skopiuj zaproszenie'})}
                </button>
            </div>
        </h4>

        
    </div>
</Dialog>