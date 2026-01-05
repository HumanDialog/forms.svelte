<script>
    import {Sidebar, SidebarBrand, getCurrentGroupName} from '$lib'
	import MessagesNavigator from "./navigator.messages.svelte";
    import {session} from '@humandialog/auth.svelte'

    $: current_group_name = getCurrentGroupName($session)

</script>

<Sidebar>
    <SidebarBrand >
        Octopus <span class="font-thin">basic</span>


    </SidebarBrand>

    <MessagesNavigator sidebar/>

</Sidebar>