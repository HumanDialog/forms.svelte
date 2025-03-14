<script>
	import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import Landing from './landing/landing.svelte'
    import AppView from './AppView.svelte';
    
    $: update($session)
    function update(...args)
    {
        
    }

  

</script>

<Authorized>
    <AppView/>
</Authorized>

<NotAuthorized>
    <Landing/>
</NotAuthorized>


