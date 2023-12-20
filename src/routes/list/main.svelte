<script>
   
	import { reef } from '@humandialog/auth.svelte';
    import {MembersPage} from '$lib';
	import { onMount } from 'svelte';
	
    let users = []
    onMount( async () =>
    {
        let result = await reef.get('app/Users')
        if(result)
        {
            users = result.User;
        }
        return () => {}
    })

  </script>

{#if users && users.length > 0}
  <MembersPage {users} name_attrib="Name" email_attrib="login" ref_attrib="$ref"/>
{/if}