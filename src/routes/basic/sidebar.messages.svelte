<script>
    import {Sidebar, SidebarBrand} from '$lib'
	import MessagesNavigator from "./navigator.messages.svelte";
    import {session} from '@humandialog/auth.svelte'

</script>

<Sidebar>
    <SidebarBrand class="hidden sm:block" >
        Octopus* <span class="font-thin">basic</span>


    </SidebarBrand>

    <MessagesNavigator sidebar/>

</Sidebar>