<script>
    import {Layout} from '$lib'
    import {reef} from '@humandialog/auth.svelte'
    import Kitchen from './Kitchen.svelte'
    import Nav from './Nav.svelte'
    import AppIcon from './appicon.svelte'
    
    reef.configure( {
                    mode: 'local',
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        users:
                        [
                            "Alice",
                            "Bob",
                            "Clerk",
                            "Chef",
                            "Courier"
                        ],
                        apiVersion: "v001"}
                   });


    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: AppIcon,
                        component: Nav
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Kitchen},
                        '/*' :          { component: Kitchen}
                    }
                },
                mainToolbar : {
                    signin: true
                },
                dark:
                {
                    optional: true,
                    default: false
                }
    }

    
</script>


<Layout {layout} />

      