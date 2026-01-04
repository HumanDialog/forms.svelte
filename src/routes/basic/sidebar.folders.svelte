<script>
       import {Sidebar,
                SidebarBrand,
                SidebarGroup,
                SidebarList,
                SidebarItem} from '$lib'
    import GroupFoldersNavigator from "./navigator.group.folders.svelte";
    import {session} from '@humandialog/auth.svelte'

    /*let current_group_name = ""
    $: validate_group_name($session)

    function validate_group_name(...args)
    {
        const gid = $session.tid;       // current tenant id
        const tInfo = $session.tenants.find(t => t.id == gid)
        if(tInfo)
            current_group_name = tInfo.name;
    }
    */

</script>

<Sidebar>
    <SidebarBrand class="hidden sm:block" summary = "Current group">
        Octopus*<span class="font-thin">basic</span>


    </SidebarBrand>


    <GroupFoldersNavigator sidebar/>


</Sidebar>
