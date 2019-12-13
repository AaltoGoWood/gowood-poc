import { Command, QueryEntity, MutateMapEventData } from '../../interfaces';

function dispatchNavigateCommands(
    dispatchFn: (e: Command) => void,
    row: QueryEntity
): void {
    // reset details
    dispatchFn({
        type: 'reset-building-assets',
        data: {
            coords: {
                lng: 24.93,
                lat: 60.18
            }
        }
    });
    if (row.visualization && row.visualization.coords) {
        // navigate in map to correct place, if any
        // TODO: refactor to visualization command
        dispatchFn({
            type: 'show-asset-origin',
            data: [
                {
                    type: 'ensure-tree',
                    coords: row.visualization.coords,
                    data: {
                        id: row.id,
                        type: row.type,
                        traversePath: row.traversePath
                    }
                }
            ]
        } as Command<MutateMapEventData[]>);
    }
    // Fetch data, and trigger
    dispatchFn({
        type: 'show-building-assets',
        data: row
    });
}

export interface BreadcrumbProps {
    traversePath: QueryEntity[];
    dispatchFn: (e: Command) => void;
}

export const Breadcrumb = (props: BreadcrumbProps) => {
    const navNodeView = (name: string, onclick: (e: any) => void) => (
        <span className="node-container">
            <button className="gowood-button small" onclick={onclick}>
                {name}
            </button>
            <span className="divider">»</span>
        </span>
    );

    return (
        <div id="breadcrumb">
            {navNodeView('Start location', (e: any) => {
                e.preventDefault();
                props.dispatchFn({
                    type: 'reset-building-assets',
                    data: {
                        coords: {
                            lng: 24.93,
                            lat: 60.18
                        }
                    }
                });
                props.dispatchFn({
                    type: 'navigate-to-building-browser'
                });
            })}
            {props.traversePath.map(node =>
                navNodeView(
                    `${node.original_type ||
                        node.type} (Id: ${node.original_id || node.id})`,
                    (e: any) => {
                        e.preventDefault();
                        dispatchNavigateCommands(props.dispatchFn, node);
                    }
                )
            )}
        </div>
    );
};
