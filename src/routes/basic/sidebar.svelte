<script>
    import {Sidebar, SidebarBrand} from '$lib'
    import Navigator from "./navigator.svelte";
    
</script>
  
<Sidebar>
    <SidebarBrand class="hidden sm:block" >
        Octopus <span class="font-thin">basic</span>
    </SidebarBrand>
        
    <Navigator sidebar/>

</Sidebar>



    
