<script>
    import { afterUpdate, onMount } from "svelte";
    import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        Spinner, ext, i18n, Dialog,
        clearActiveItem, SHOW_MENU_LEFT, Ricon
    }   from '$lib'

    

    export let user = { }
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined

    let emailAttrib = 'login'


    let reloadTicket = -1
    let lastReloadTicket = 0
    
    let allRoles = []
    let allAuthAccesses = []


    let rootDialog
    export function show(element, roles, authAccesses)
    {
        user = { ...element }
        allRoles = roles
        allAuthAccesses = authAccesses

        fetch_user_details(user).then((res) => rootDialog.show())
    }

    async function fetch_user_details(user)
    {
        let details = await reef.get(`/sys/user_details?email=${user[emailAttrib]}`)
        set_user_info(user, details);
    }

    function set_user_info(user, info)
    {
        user.auth_group = info.auth_group ?? 0;
        user.files_group = info.files_group ?? 0;
        user.avatar_url = info.avatar_url ?? "";
        user.access_details = info.access_details
        user.acc_role = info.access_details?.role ?? '';
        user.removed = info.removed ?? false;
        user.invitation_not_accepted = info.invitation_not_accepted ?? false;
        //console.log(info)

        if(user.removed)
            user.membership_tag = i18n({en: 'Removed', es: 'Eliminado', pl: 'Usunięto'});
        else if(user.invitation_not_accepted)
            user.membership_tag = i18n({en: 'Invited', es: 'Invitado', pl: 'Zaproszono'});
        else
            user.membership_tag = i18n({en: 'Accepted', es: 'Aceptado', pl: 'Zaakceptowano'});

        user.org_auth_group = user.auth_group
        user.org_acc_role = user.acc_role

        //user.Id = new_reef_user_id++;
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
            {
                prevHeight = myRect.height
                if(onSizeChanged)
                    onSizeChanged();
            }

            //closeButtonPos = `top: calc(${myRect.top}px - 2.25rem); left: calc(${myRect.right}px - 1rem)`
            closeButtonPos = `top: calc(${myRect.top}px - 0.25rem); left: calc(${myRect.right}px - 1.25rem)`
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

    async function onSave(e)
    {
        let result = true

        console.log('onSave', user)

        if(user.org_auth_group != user.auth_group)
            result = await saveAuthPrivileges(user, user.auth_group)
        
        if(result && user.org_acc_role != user.acc_role)
            result = await saveAccessRole(user, user.acc_role)

        if(result)
            rootDialog.hide()
    }

    async function saveAccessRole(user, role)
    {
        if(user.access_details && user.access_details.role != role)
        {
            const email = user[emailAttrib];
            const res = await reef.fetch(`/json/anyv/sys/set_user_role?email=${email}&role=${role}`)
            if(res.ok)
            {
                return true;
            }
            else
            {
                const err_msg = await res.text();
                onErrorShowAlert(err_msg);
                return false;
            }
        }
        return false;
    }

    async function saveAuthPrivileges(user, flags)
    {
        let email = user[emailAttrib];
        const res = await reef.fetch(`/json/anyv/sys/set_user_details?email=${email}&auth_group=${flags}`)
        if(res.ok)
        {
            return true;
        }
        else
        {
            const err_msg = await res.text();
            onErrorShowAlert(err_msg);
            return false;
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-element-interactions -->
 
<Dialog bind:this={rootDialog}>
        <div class="
                paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                m-0 pt-5 pb-5 px-8
                sm:rounded
                bg-stone-200 dark:bg-stone-900
                flex flex-col
                "
        bind:this={rootElement} on:click={clearSelection}>

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
                    <span>{user.Name} - </span><span class="text-left">{i18n({en: 'Permissions', es: 'Permisos', pl: 'Uprawnienia'})}</span>
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
        {#if user}
            
            <div class="px-2 ">
            <h4>{i18n({en: 'Users management', es: 'Gestión de usuarios', pl: 'Zarządzanie użytkownikami'})}</h4>
            <p class="flex flex-col">
                {#each allAuthAccesses as authAccess}
                    {@const isActive = user.auth_group == authAccess.key}
                    <span class=" px-2 my-1 cursor-pointer
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-200 dark:hover:bg-stone-700
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded"
                                class:bg-stone-200={isActive}
                                class:dark:bg-stone-700={isActive}
                                class:dark:text-white={isActive}
                                disabled={isActive}
                                on:click={(e)=>user.auth_group = authAccess.key}>
                        {authAccess.name}
                    </span>
                {/each}

            </p>
            </div>

            <div class="px-2 ">
            <h4>{i18n({en: 'Role in the application', es: 'Papel en la aplicación', pl: 'Rola w aplikacji'})}</h4>
            <p class="flex flex-col">
                {#each allRoles as role}
                    {@const isActive = user.acc_role == role.name}
                    <span class=" px-2 my-1 cursor-pointer
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-200 dark:hover:bg-stone-700
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded"
                                class:bg-stone-200={isActive}
                                class:dark:bg-stone-700={isActive}
                                class:dark:text-white={isActive}
                                disabled={isActive}
                                on:click={(e)=>user.acc_role = role.name}>
                        {role.summary}
                    </span>
                {/each}

            </p>
            </div>

            <div class="px-2">
            <h4 >_; Status; Estado; Status</h4>
            <p class="mr-4 ">{user.membership_tag}</p>
            </div >

        {:else}
            <Spinner />
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
                        hover:bg-stone-200 hover:dark:bg-stone-700
                        "
                        on:click={ closeDialog }> Cancel
                </button>

                <button class="px-4 mx-2
                            bg-stone-100 dark:bg-stone-700
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700"
                        on:click={ onSave }> Save
                </button>
            </div>
        </h4>




</div>
</Dialog>
