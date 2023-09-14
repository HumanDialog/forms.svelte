
export class rTable_column
{
    public header   :string;
    public field    :string;
    public size     :number = 0;
    public cl       :string = '';
}

export class rTable_definition
{
    public columns :rTable_column[] = [];
    
    public items : Array<any> = null;
    public items_ticket :number = 0;
}