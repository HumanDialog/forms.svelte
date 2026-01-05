<script>
    import {Sidebar, SidebarBrand, getCurrentGroupName} from '$lib'
	import Navigator from "./navigator.svelte";
    import {reef, session} from '@humandialog/auth.svelte'

    $: current_group_name = getCurrentGroupName($session)

</script>

<Sidebar>
    <SidebarBrand class="hidden sm:block" 
                  summary={current_group_name}>
        Octopus <span class="font-thin">basic</span>

        <!--span   slot="summary"
                class="text-xs pl-2.5 font-semibold text-stone-600 dark:text-stone-300"
                class:hidden={!current_group_name}>
            {current_group_name}
        </span-->


    </SidebarBrand>


    <Navigator sidebar/>

</Sidebar>
