import { useState } from 'react'
import CondSel from './CondSel'
import VoterLogin from './VoterLogin'
import VoterAssemblyOptions from './VoterAssemblyOptions'  // NOVO
import VotingBooth from './VotingBooth'
import VotingResults from './VotingResults'  // NOVO - versão votante dos resultados
import VotingConfirmation from './VotingConfirmation'

export default function VotingModule() {
  const [votingFlow, setVotingFlow] = useState({
    step: 'selection',  // selection, login, options, voting, results, confirmation
    condominiumId: null,
    condominiumName: null,
    voter: null,
    assembly: null,
    votes: {},
    votingWeight: 1
  })

  const nextStep = (step, data) => {
    setVotingFlow(prev => ({ ...prev, step, ...data }))
  }

  switch (votingFlow.step) {
    case 'selection':
      return <CondSel onSelect={(condId, condName) => 
        nextStep('login', { condominiumId: condId, condominiumName: condName })
      } />
    
    case 'login':
      return <VoterLogin 
        condominiumId={votingFlow.condominiumId}
        condominiumName={votingFlow.condominiumName}
        onLoginSuccess={(voter, assembly, votingWeight) => {
          console.log('Login success - assembly:', assembly)  // Debug
          nextStep('options', { voter, assembly, votingWeight })
        }}
        onBack={() => nextStep('selection')}
      />
    
    case 'options':
      return <VoterAssemblyOptions 
        voter={votingFlow.voter}
        assembly={votingFlow.assembly}
        votingWeight={votingFlow.votingWeight}
        condominiumId={votingFlow.condominiumId}
        onVote={() => nextStep('voting')}
        onViewResults={() => nextStep('results')}
        onBack={() => nextStep('login')}
      />
    
    case 'voting':
      return <VotingBooth 
        voter={votingFlow.voter}
        assembly={votingFlow.assembly}
        votingWeight={votingFlow.votingWeight}
        condominiumId={votingFlow.condominiumId}
        onVotingComplete={(votes) => 
          nextStep('confirmation', { votes })
        }
        onBack={() => nextStep('options')}
      />
    
    case 'results':
      return <VotingResults 
        assembly={votingFlow.assembly}
        condominiumId={votingFlow.condominiumId}
        onBack={() => nextStep('options')}
      />
    
    case 'confirmation':
      return <VotingConfirmation 
        voter={votingFlow.voter}
        assembly={votingFlow.assembly}
        onFinish={() => {
          setVotingFlow({
            step: 'selection',
            condominiumId: null,
            condominiumName: null,
            voter: null,
            assembly: null,
            votes: {},
            votingWeight: 1
          })
        }}
      />
    
    default:
      return <CondSel onSelect={() => {}} />
  }
}