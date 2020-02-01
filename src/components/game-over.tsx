import React, {Component} from "react";
import Player from "../player";


interface IGameOverProps {
    winArr: Player[];
}


export default class GameOver extends Component<IGameOverProps, {}> {
    render() {
        const winElems = this.props.winArr.map(player => {
            return <li>{ player.name }</li>
        });

        return (
            <div>
                <h4>Winners ({ this.props.winArr.length })</h4>
                <ul>
                    { winElems }
                </ul>
            </div>
        );
    }
}