Dominion
=

This is still very much a work-in-progress.

A bare-bones simulator and visualizer for the card game 'Dominion'.

## Strategies

I hand-coded a few AI strategies to test against the human opponent. Descriptions below.

### Big Money

Each turn, buy a province if you can afford it. Otherwise, buy gold or silver. If cannot afford either of those, buy nothing.

### Smart Big Money

Same as "Big Money", but buy Duchies near the end.

### Smart Duchy

- always go for province when you have 8
- always go for duchy when you have 5
- always go for smithy when you have 4
- always go for silver when you have 3
- go for gold when you have 6, if there are 4 or more provinces

### Smart Smithy

???

### Big Money Smithy

???

## Run

Start up a web server from this directory, for example run `http-server`

## Uses

* play dominion against computer opponent(s)
* simulate strategies over large number of iterations to see their effectiveness

## Implementation Details

* written in Javascript, with Angular framework and Bootstrap for prettiness
* uses Underscore library for shuffling cards (Fisher-Yates shuffle)
