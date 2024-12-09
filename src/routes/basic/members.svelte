<script>
   
	import { reef } from '@humandialog/auth.svelte';
    import {MembersPage} from '$lib';
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
                            }
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