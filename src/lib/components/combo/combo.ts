export class rCombo_item
{
    public Key     :any | undefined;
    public Name    :string | undefined;
    public Avatar  :string | undefined;  //url to avatar
    public Color   :string | undefined;
    public Icon    :any | undefined = undefined;
}



export class rCombo_definition
{
    public source :rCombo_item[] = [];
    
    public collection_expr  :string | undefined;
    public collection_path  :string | undefined;
    public collection       :object[] | undefined;
    public onCollect       = undefined;
    
    public element_key      :string | undefined;
    public element_name     :string | undefined;
    public element_avatar   :string | undefined;
    public element_icon     :string | undefined;

}

export const cached_sources : Map<string, Promise<object>> = new Map<string, Promise<object>> ();
