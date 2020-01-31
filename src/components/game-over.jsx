import React from "react";

/**
 * props:
 *      - winArr: array of winning players
 */
export default class GameOver extends React.Component {
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