import { Selection_edge, Selection_edge_info, Selection_range } from "./Selection_range";

export class Selection_helper {

    private static nodewalk(node: Node, func: (node: Node) => boolean): boolean {
        let result = func(node);
        for (node = node.firstChild; result !== false && node; node = node.nextSibling)
            result = this.nodewalk(node, func);
        return result;
    }

    public static create_cursor_range(elem: HTMLElement, nrOfChars: number): [Range, Node]
    {
        let result: [Node, number] = [elem, 0];
        this.nodewalk(elem, (node: Node) => {
            /* if (nrOfChars === 0) {
                result = [node, 0]
                return false;
            }
            */
            if (node.textContent && !node.firstChild && node.nodeType !== node.COMMENT_NODE && node.nodeType === node.TEXT_NODE) {
                if (node.textContent.length < nrOfChars) {
                    nrOfChars -= node.textContent.length;
                }
                else {
                    result = [node, nrOfChars]
                    return false;
                }

            };
            result = [node, nrOfChars]
        });
        const range = document.createRange()
        range.setStart(result[0], result[1]);
        range.setEnd(result[0], result[1]);
        return [range, result[0]];
    }

    public static create_range(elem: HTMLElement, start: number, end: number): Range {

        const nodesToFind: Array<Node> = [null, null];
        const selPoints: Array<number> = [0, 0];
        let nrOfChars = start;
        let nrOfCharsEnd = end;
        this.nodewalk(elem, (node: Node) => {
            if (nodesToFind.every(v => v)) {
                return false;
            }
            if (start <= 0) {
                nodesToFind[0] = node;
                selPoints[0] = 0;
            }
            else if (node.textContent && !node.firstChild && node.nodeType !== node.COMMENT_NODE && node.nodeType === node.TEXT_NODE) {
                const nodeLength = node.textContent.length;
                const nrToCompare = (nodesToFind[0] === null) ? nrOfChars : nrOfCharsEnd;
                if (nrToCompare > nodeLength) {
                    nrOfChars -= nodeLength;
                    nrOfCharsEnd -= nodeLength
                }
                else {
                    if (nodesToFind[0] !== null ) {
                        nodesToFind[1] = node;
                        selPoints[1] = nrOfCharsEnd;
                    }
                    else {
                        nodesToFind[0] = node;
                        selPoints[0] = nrOfChars;
                        if (nrOfCharsEnd <= nodeLength) {
                            nodesToFind[1] = node;
                            selPoints[1] = nrOfCharsEnd;
                        } else{
                            nrOfCharsEnd -= nodeLength;
                        }
                    }
                }
            };
        });
        if (!nodesToFind[0]) {
            nodesToFind[0] = elem;
        }
        if (!nodesToFind[1]) {
            nodesToFind[1] = nodesToFind[0];
        }
        const range = document.createRange()
        range.setStart(nodesToFind[0], selPoints[0]);
        range.setEnd(nodesToFind[1], selPoints[1]);
        return range;


    }


    public static get_selection(elem :HTMLElement) :Selection_range
    {
        const sel :Selection = window.getSelection();
        if(sel.anchorNode === elem)
        {
            return new Selection_range( new Selection_edge(sel.anchorOffset, sel.anchorOffset),
                                        new Selection_edge(sel.focusOffset, sel.focusOffset));
        }
        else
        {
            const nodesToFind = [sel.anchorNode, sel.focusNode];
            if (!elem.contains(sel.anchorNode) || !elem.contains(sel.focusNode))
                return undefined;


            const found: Array<boolean> = [false, false];
            let i;
            let edges_positons = [0, 0];
            this.nodewalk(elem, (node: Node) => {
                for (i = 0; i < 2; i++) 
                {
                    if (node === nodesToFind[i]) 
                    {
                        found[i] = true;
                        if (found[i === 0 ? 1 : 0])
                            return false; // all done
                    }
                }

                if (node.textContent && !node.firstChild && node.nodeType !== node.COMMENT_NODE) 
                {
                    for (i = 0; i < 2; i++) 
                    {
                        if (!found[i]) 
                        {
                            edges_positons[i] += node.textContent.length;
                        }
                    }
                }
            });

            edges_positons[0] += sel.anchorOffset;
            edges_positons[1] += sel.focusOffset;

            let begin = new Selection_edge(edges_positons[0], sel.anchorOffset);
            let end = new Selection_edge(edges_positons[1], sel.focusOffset);

            if(sel.anchorOffset == sel.anchorNode.textContent.length)
                begin.info = Selection_edge_info.Node_end;
            else if(sel.anchorOffset == 0)
                begin.info = Selection_edge_info.Node_start;

            if(sel.focusOffset == sel.focusNode.textContent.length)
                end.info = Selection_edge_info.Node_end;
            else if(sel.focusOffset == 0)
                end.info = Selection_edge_info.Node_start;

            if(begin.absolute_index > end.absolute_index)
            {
                return new Selection_range( new Selection_edge(end.absolute_index, end.node_index, end.info), 
                                            new Selection_edge(begin.absolute_index, begin.node_index, begin.info));
                
            }
            else
            {
                return new Selection_range( new Selection_edge(begin.absolute_index, begin.node_index, begin.info), 
                                            new Selection_edge(end.absolute_index, end.node_index, end.info));
            }
        }
    }

}
