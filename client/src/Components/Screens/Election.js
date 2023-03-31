import React from "react";
import { useTimer } from 'react-timer-hook';
import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import ElectionABI from '../../build/Election.sol/Election.json'
import ElectionOrganiser from "../../build/ElectionOrganizer.json";

import { ethers } from "ethers";


import {
	AddCandidateModal,
	Candidate,
	VoteModal,
	DeleteModal,
} from './modals'

import { OklahomaModal } from "./modals/OklahomaModal";
import {BordaModal} from './modals/BordaModal';

import { AVATARS, STATUS } from '../constants'
import { Status, CardItem, TimerStyled } from "./utilities";

import Navbar from './Navbar';

import '../styles/Election.scss';
import '../styles/Layout.scss';

function Election() {
	const [isAdmin, setAdmin] = useState(false);
	const [status, setStatus] = useState(STATUS.PENDING)

	const search = useLocation().search;
	const contractAddress = new URLSearchParams(search).get('contractAddress');
	const organizerAddress = new URLSearchParams(search).get('organizerAddress');
	const name = new URLSearchParams(search).get('name');
	const publicAddress = new URLSearchParams(search).get('publicAddress');
	const [electionDetails, setElectionDetails] = useState({});
	const [candidates, setCandidates] = useState([])
	const [voterscount, setVotersCount] = useState(0);
	const [ballotAddress,setBallotAddress] = useState('');
	const [ballotType,setBallotType] = useState(-1);
	//to support Borda Election
	const [supportVar,setSupportVar] = useState(0);



	const fetchElectionDetails = async () => {
		try{

			const { ethereum } = window;
    		if (ethereum) {
      		const provider = new ethers.providers.Web3Provider(ethereum);
      		const signer = provider.getSigner();
			  const electionContract = new ethers.Contract(
				contractAddress,
				ElectionABI.abi,
				signer
			  );

			//fetched election details
			const electionDetail =await electionContract.getElectionInfo();
			updateStatus(Number(electionDetail.startDate._hex), Number(electionDetail.endDate._hex));

			const ballotType = await electionContract.getBallotType();
			setBallotType(Number(ballotType._hex));
			if(Number(ballotType._hex) === 4){
				setSupportVar(1001);
			}
			setElectionDetails(electionDetail);

			//fetch ballot address
			// const ballot_add = await electionContract.getBallot();
			// setBallotAddress(ballot_add);


			//fetched all candidates
			const cand =await electionContract.getCandidates();
			setCandidates(cand);
			

			const no  = await electionContract.getVoterCount();

			//total voters
			setVotersCount(Number(no._hex));	
			
			
			}

		}catch(err){
			console.log(err);
		}
	}



	const [winnerDetails, setWinnerDetails] = useState([
		
	]);

	const getWinnerDetails = async () => {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const electionContract = new ethers.Contract(
			contractAddress,
			ElectionABI.abi,
			signer
		  );
		  let _winnerDetails = [];
		  let winners = await electionContract.getWinners();
		  console.log('winner',winners);
		  setWinnerDetails(winners);
		}
	}

	const getResults = async () => {
		const edate = electionDetails.endDate;
		if(Date.now() >= edate) {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const electionContract = new ethers.Contract(
			contractAddress,
			ElectionABI.abi,
			signer
		  );
		  electionContract.getResult();	
		}
		
		}
	}

	useEffect(() => {
		if(1) {
			setAdmin(true);
		}
	}, [])

	const updateStatus = (sdate,edate) => {
		sdate = sdate * 1000;
		edate = edate * 1000;
		const timestamp = Date.now();
		if(timestamp < sdate) {
			setStatus(STATUS.PENDING);
		} else if(timestamp < edate) {
			setStatus(STATUS.ACTIVE);
		} else {
			setStatus(STATUS.CLOSED);
		}
	}

	
	useEffect(() => {
		fetchElectionDetails();
	},[contractAddress])

	const MyTimer = ({ sdate, edate }) => {
		sdate *= 1000;
		edate *= 1000;
		
		let expiryTimestamp = 0;
		if(Date.now() < sdate) {
			expiryTimestamp = sdate;
		} else {
			expiryTimestamp = edate;
		}
		
		const {
			seconds,
			minutes,
			hours,
			days,
			start
		} = useTimer({ expiryTimestamp, onExpire: () => {expiryTimestamp = edate;
			//  Date.now() >= edate && winnerDetails.length === 0 && getResults()
			}, 
			 autostart: "false"});
		
		useEffect(() => {
			start();
			// updateStatus((electionDetails?.startDate._hex), Number(electionDetails?.endDate._hex)); 
		}, [expiryTimestamp])
		
		return (
			<TimerStyled seconds={seconds} minutes={minutes} hours={hours} days={days} />
		);
	}

	return (
		<div style={{backgroundColor: "#f7f7f7", minHeight: "100%"}}>
			<Navbar header={name} infoText={publicAddress} organizerAddress={organizerAddress} pictureUrl="/assets/avatar.png"/>
			
			<div style={{padding: "30px"}}>
				<div style={{width: "100%"}}>
					<div style={{float: "left"}}>
						<div style={{display: "flex"}}>
							<h5 style={{marginBottom: "0px", width: "max-content"}}>{"Test Election"}</h5>
							<Status
								status={status}
								text={status.charAt(0).toUpperCase() + status.slice(1)}
							/>
						</div>
						<font size="2" className="text-muted" style={{marginTop: "0px"}}>{contractAddress}</font>
					</div>


					<div style={{float: "right", display: "flex"}}>
						<MyTimer sdate = {electionDetails.startDate} edate = {electionDetails.endDate}/>
						<DeleteModal Candidate = {Candidate} isAdmin = {isAdmin} isPending = {true}/>
						{ballotType===4 &&
							<BordaModal Candidate = {Candidate} candidates = { candidates } status = { STATUS.ACTIVE } contractAddress = {contractAddress} ballotAddress={ballotAddress}/>
						}
						{ballotType===2 &&
							<OklahomaModal Candidate = {Candidate} candidates = { candidates } status = { STATUS.ACTIVE } contractAddress = {contractAddress} ballotAddress={ballotAddress}/>
						}
						{ballotType===1 &&
							<VoteModal Candidate = {Candidate} candidates = { candidates } status = { STATUS.ACTIVE } contractAddress = {contractAddress} ballotAddress={ballotAddress}/>
						}
					</div>
				</div>

				<br/><br/><br/>

				<div className="cardContainer row">
					<CardItem headerValue={"General"} descriptor="Algorithm" imgUrl="/assets/totalElections.png"/>

					<CardItem headerValue={new Date(electionDetails?.startDate * 1000).toLocaleString()} descriptor="Start date" imgUrl="/assets/activeElections.png" imgBackground="#eaffe8"/>

					<CardItem headerValue={new Date(electionDetails?.endDate * 1000).toLocaleString()} descriptor="End date" imgUrl="/assets/endedElections.png" imgBackground="#ffe8e8"/>

					<CardItem headerValue={voterscount } descriptor="Total voters" imgUrl="/assets/pendingElections.png" imgBackground="#fffbd1"/>
				</div>

				<div className="layoutBody row">
					<div className="lhsLayout" style={{overflowY: "scroll"}}>
						{
							status == STATUS.CLOSED
							?
							<div>
								<span onClick={getResults} className="voteButton" style={{float: "right", marginTop: "10px", width: "100px"}}>Get Results</span>
								<span onClick={getWinnerDetails} className="voteButton" style={{float: "right", marginTop: "10px", width: "100px"}}>Show Winner</span>
							</div>

							:
								<span onClick={getResults} className="voteButton voteButtonDisabled" style={{float: "right", marginTop: "10px", width: "100px"}}>Get Result</span>
						}

						{
							winnerDetails.length > 0 && 
							<>
								<div className="lhsHeader" style={{marginTop: "10px"}}>
									<h5>Results</h5>
								</div>

								<br/>

								<div style={{display: "flex", justifyContent: "space-around", flexWrap: "wrap"}}>
									{
										winnerDetails?.map((candidate) => (
											candidate?.name !== ""
											&&
									
											<Candidate
												name={candidate?.name}
												id={supportVar+ Number(candidate?._hex)}
												about={candidate?.about}
												voteCount={candidate?.voteCount}
												imageUrl={AVATARS[candidate?.id % AVATARS?.length] || '/assets/avatar.png'}
												modalEnabled="true"
												ballotAddress = {ballotAddress}
												ballotType = {ballotType}
											/> 
										))
									}	
								</div>

								<hr/>
							</>
						}

						<div className="lhsHeader" style={{marginTop: "10px"}}>
							<h5>Election Details</h5>
						</div>

						<div className="lhsBody" style={{textAlign: "justify"}}>
							<font size="2" className="text-muted">
								<p>
									{electionDetails.description}
								</p>
							</font>

							<br/>

							<h5>About {"General"} Algorithm</h5>
							<font size="2" className="text-muted">
								In General or Regular voting algorithm, winner(s) is(are) chosen
								from the list of candidates according to the number of votes they
								get. Those with the maximum number of votes are chosen as the winner
								of the candidates. If 2 or more candidates are eligible for winning,
								then it depends upon the organization to whether choose a candidate by
								a draw or by any other means.
							</font>
						</div>
					</div>

					<div className="rhsLayout" style={{overflowY: "scroll"}}>
						<div className="lhsHeader" style={{marginTop: "10px", display: 'flex', justifyContent: 'space-between'}}>
							<h5 style={{width: "60%"}}>Candidates ({candidates.length})</h5>
							{
								// isAdmin && status == STATUS.PENDING &&
								<AddCandidateModal organizerAddress={organizerAddress}  electionAddress={contractAddress} />
							}
						</div>

						<br/>

						{
							candidates?.map((candidate) => (
								<Candidate
									name={candidate?.name}
									id={Number(candidate?.candidateID._hex)}
									about={candidate?.description}
									voteCount={candidate?.voteCount}
									imageUrl={AVATARS[candidate?.id % AVATARS?.length] || '/assets/avatar.png'}
									modalEnabled="true"
									ballotAddress={ballotAddress}
								/> 
							))
						}
					</div>
				</div>

				<br/>
			</div>
		</div>
	)
}

export default Election;