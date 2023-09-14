export enum Selection_edge_info
{
    None = 0,
    Node_start = 1,
    Node_end = 2
}

export class Selection_edge
{
    public absolute_index       :number;
    public node_index           :number;
    public info                 :Selection_edge_info;
    public node_left            :number;
    public node_top             :number;
    public node_right           :number;
    public node_bottom          :number;

    constructor(abs_index :number, node_index :number, info :Selection_edge_info = Selection_edge_info.None)
    {
        this.absolute_index = abs_index;
        this.node_index = node_index;
        this.info = info;
        this.node_left = 0;
        this.node_top = 0;
        this.node_right = 0;
        this.node_bottom = 0;
    }

    public is_equal(c :Selection_edge) :boolean
    {
        if(!c)
            return false;

        return (    c.absolute_index == this.absolute_index &&
                    c.node_index == this.node_index &&
                    c.info == this.info );
    }

    public clone() :Selection_edge
    {
        let r :Selection_edge = new Selection_edge(this.absolute_index, this.node_index, this.info);
        r.node_left = this.node_left;
        r.node_top = this.node_top;
        r.node_right = this.node_right;
        r.node_bottom = this.node_bottom;
        return r;
    }
}

export class Selection_range
{
    public begin                :Selection_edge;
    public end                  :Selection_edge;
    
    public is_multi             = () => {this.begin == this.end || this.end.absolute_index <= 0};

    constructor(b :Selection_edge, e :Selection_edge)
    {
        this.begin = b;
        this.end = e;
    }

    public clone()  :Selection_range
    {
        return new Selection_range(this.begin.clone(), this.end.clone());
    }

    public is_equal( c :Selection_range) :boolean
    {
        if(!c)
            return false;

        return (    c.begin.is_equal(this.begin) &&
                    c.end.is_equal(this.end) );
    }

    public static unknown = new Selection_range(new Selection_edge(-1,-1), new Selection_edge(-1,-1));
}
