<script>
   
	import { reef, session, signInHRef } from '@humandialog/auth.svelte';
    import {MembersPage, onErrorShowAlert} from '$lib';
	import { onMount } from 'svelte';
	
    let users = []
    onMount( async () =>
    {
        //let result = await reef.get('app/Users')
        let result = await reef.post('group/query',
                            {
                                Id: 1,
                                Name: 'Users',
                                Tree:[
                                    {
                                        Id: 1,
                                        Association: 'Members/User'
                                    }
                                ]                    
                            },
                            onErrorShowAlert
                        )
        if(result)
        {
            users = result.User;
        }
        return () => {}
    })

  </script>

{#if users && users.length > 0}
  <MembersPage {users} nameAttrib="Name" emailAttrib="login" refAttrib="$ref" showAccessRoles/>
{/if}