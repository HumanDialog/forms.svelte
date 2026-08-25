<script>
    import {Sidebar, SidebarBrand, getCurrentGroupName
    } from '$lib'
	import TilosNavigator from "./navigator.tilos.svelte";
    import {session} from '@humandialog/auth.svelte'

    $: current_group_name = getCurrentGroupName($session)

    
</script>
  
<Sidebar>
    <SidebarBrand >
        TILOS <span class="font-thin">Users Hub</span>
        
    </SidebarBrand>
    
        
    <TilosNavigator sidebar/>

</Sidebar>



    
