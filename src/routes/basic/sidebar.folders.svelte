<script>
       import {Sidebar,
                SidebarBrand,
                getCurrentGroupName} from '$lib'
    import GroupFoldersNavigator from "./navigator.group.folders.svelte";
    import {session} from '@humandialog/auth.svelte'

    $: current_group_name = getCurrentGroupName($session)

</script>

<Sidebar>
    <SidebarBrand summary={current_group_name}>
        Octopus <span class="font-thin">basic</span>


    </SidebarBrand>


    <GroupFoldersNavigator sidebar/>


</Sidebar>
