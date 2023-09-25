<script>
    import Router from 'svelte-spa-router'
    import {wrap} from 'svelte-spa-router/wrap'
    import Loading from './loading.svelte'
    
    export let config;
    
    let component = null;
    let props = {};
    let routes = null;
    
    $: {
        if(config)
        {
            if(config.props)
                props = config.props;

            if(config.module)
            {
                import(config.module).then( (module) => { 
                                                            component = module.default || module; 
                                                        } );
            }
            else if(config.component)
                component = config.component;
            else if(config.routes)
            {
                routes = new Map();
                Object.keys(config.routes).forEach((path) => 
                {
                    const route_element = config.routes[path];
                    
                    if(route_element.component)
                    {
                        routes.set(path, wrap({
                            component: route_element.component,
                            props: route_element.props,
                            conditions: route_element.conditions
                        }))
                    }
                    else if(route_element.module)
                    {
                        routes.set(path, wrap({
                            asyncComponent: () => import(route_element.module),
                            loadingComponent: Loading,
                            loadingParams: { message: 'Loading the route '+ route_element.module },
                            props: route_element.props,
                            conditions: route_element.conditions
                        }))
                    }
                })
            }
            else
            {
                component = null;
                props = {};
                routes = null;
            }
        }
        else
        {
            component = null;
            props = {};
            routes = null;
        }
    }
  
</script>


{#if routes}
    <Router {routes}/>
{:else if component}
    <svelte:component this={component} {...props}/>
{:else if config && config.module}
    <p>Loading component...</p>
{:else}
    <slot name="alt" />
{/if}


