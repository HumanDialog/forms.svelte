<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import { 
        Modal, Input,
        randomString, i18n, onErrorShowAlert, reloadWholeApp } from '$lib'
 
    export let afterGroupCreated = undefined

    let newGroupParams = {
        name: ''
    }

    let newGroupModalVisible = false;
    let newGroupIdempotencyToken = ''
    export function show()
    {
        newGroupParams.name = '';
        newGroupModalVisible = true;
        newGroupIdempotencyToken = randomString(8);
    }

    export function hide()
    {
        newGroupModalVisible = false;
    }

    async function onNewGroupOK()
    {
        const appId = $session.appId
        if(!appId)
        {
            return onNewGroupCancel()
        }

        const appInstanceId = $session.configuration.tenant
        if(!appInstanceId)
        {
            return onNewGroupCancel()
        }

            const body = {
                app_id: $session.appId,
                tenant: $session.configuration.tenant,
                org_name: newGroupParams.name,
                idempotency_token: newGroupIdempotencyToken
            }

            const res = await reef.fetch(  "/dev/create-group-for-me",
                                {
                                    method: 'post',
                                    body : JSON.stringify(body)
                                });

            if(res.ok)
            {
                await reef.refreshTokens()
                if(afterGroupCreated)
                    afterGroupCreated()
                //reloadWholeApp()
            }
            else
            {
                const result = await res.json();
                console.error(result.error);
                onErrorShowAlert(result.error)
            }

        newGroupParams.name = '';
        newGroupModalVisible = false;
    }

    function onNewGroupCancel()
    {
        newGroupParams.name = '';
        newGroupModalVisible = false;
    }


</script>


<Modal  bind:open={newGroupModalVisible}
        title={i18n(['Create group', 'Crear grupo', 'Utwórz grupę'])}
        okCaption={i18n(['Create', 'Crear', 'Utwórz'])}
        onOkCallback={onNewGroupOK}
        onCancelCallback={onNewGroupCancel}
>
    <Input  label={i18n(['Group name', 'Nombre del grupo', 'Nazwa grupy'])}
            placeholder=''
            self={newGroupParams}
            a="name"
            required/>
</Modal>