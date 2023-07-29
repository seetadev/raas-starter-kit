const fs = require('fs');
const chai = require('chai');
const path = require('path');
const sinon = require('sinon');
const expect = chai.expect;
const EventEmitter = require('events');
const LighthouseAggregator = require('../lighthouseAggregator');

describe('LighthouseAggregator', function() {
    let aggregator;
    let stateFilePath;

    beforeEach(function() {
        aggregator = new LighthouseAggregator();
        stateFilePath = path.join(__dirname, '../../cache/lighthouse_agg_state.json');
    
        // Create a WriteStream stub
        writeStream = new EventEmitter();
        writeStream.pipe = sinon.stub();
        sinon.stub(fs, 'createWriteStream').returns(writeStream);
    
        // Create a response stub
        response = { data: new EventEmitter() };
      });
    
      afterEach(function() {
        // Restore the stubs after each test
        sinon.restore();
      });
    
      after(function() {
        // Cleanup the dummy state file
        const filePath = path.join(__dirname, '../../cache/lighthouse_agg_state.json');

        fs.unlinkSync(filePath);
      });

    describe('#saveState() and #loadState()', function() {
        it('returns an empty array when state file does not exist', function() {
            const state = aggregator.loadState();
            expect(state).to.eql([]);
        });

        it('saves the current state to the state file', function() {
            aggregator.enqueueJob('testcid', 'testtxid');

            // Act
            try {
                aggregator.saveState(stateFilePath);
            } catch (err) {
                console.error(err);
            }

            // Assert
            const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
            console.log(state);
            expect(state).to.eql([{
                cid: 'testcid',
                txID: 'testtxid'
            }]);
        });

        context('when state file exists', function() {
            it('returns the data from the state file', function() {
                const state = aggregator.loadState();
                expect(state).to.eql([{
                    cid: 'testcid',
                    txID: 'testtxid'
                }]);
            });
        });

        describe('#enqueueJob()', function() {
            it('adds a new job to the aggregatorJobs array', function() {
                expect(aggregator.aggregatorJobs.length).to.equal(1);
                aggregator.enqueueJob('testcid2', 'testtxid2');
                expect(aggregator.aggregatorJobs.length).to.equal(2);
                expect(aggregator.aggregatorJobs[0]).to.deep.equal({
                    cid: 'testcid',
                    txID: 'testtxid'
                });
            });
        });

        describe('#dequeueJob()', function() {
            it('removes a job from the aggregatorJobs array', function() {
                expect(aggregator.aggregatorJobs.length).to.equal(1);
                aggregator.enqueueJob('testcid3', 'testtxid3');
                expect(aggregator.aggregatorJobs.length).to.equal(2);
                aggregator.dequeueJob('testtxid', 'testcid');
                expect(aggregator.aggregatorJobs.length).to.equal(2);
                aggregator.dequeueJob('testcid3', 'testtxid3');
                expect(aggregator.aggregatorJobs.length).to.equal(1);
                expect(aggregator.aggregatorJobs[0]).to.deep.equal({
                    cid: 'testcid',
                    txID: 'testtxid'
                });
            });
        });
    });
});