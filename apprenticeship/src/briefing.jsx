// briefing.jsx — short, clear mission explainer shown between title and creation
function Briefing({ onContinue, onBack }){
  return (
    <div className="briefing">
      <div className="briefing-card">
        <div className="briefing-eyebrow">The Charge</div>
        <h2>Walk your caravan to Halois.</h2>
        <p className="briefing-lede">
          You are an apprentice Keeper. Every five years the apprentices cross six wildlands on foot to
          <strong> Halois</strong>, where the Guild grants the license that binds Keeper and Beast for life.
        </p>

        <div className="briefing-rules">
          <div className="brule">
            <span className="bnum">1</span>
            <div>
              <h4>Keep the Bonds whole</h4>
              <p>Each apprentice is bonded to a Beast. If a Bond breaks, they leave the road. Lose them all and the caravan ends.</p>
            </div>
          </div>
          <div className="brule">
            <span className="bnum">2</span>
            <div>
              <h4>Outrun the Hollowing</h4>
              <p>A spreading silence unmakes the bond between Keeper and Beast. The longer you linger, the further it creeps.</p>
            </div>
          </div>
          <div className="brule">
            <span className="bnum">3</span>
            <div>
              <h4>Manage the march</h4>
              <p>Pace, rations, and provisions all cost something. Resupply at the towns. Face each land's Legendary Beast.</p>
            </div>
          </div>
        </div>

        <p className="briefing-foot">Reach the gate at Halois with Bonds intact, and the Guild will name you Keeper.</p>

        <div className="briefing-actions">
          <button className="btn ghost" onClick={onBack}>Back</button>
          <button className="btn" onClick={onContinue}>Form your caravan</button>
        </div>
      </div>
    </div>
  );
}
window.Briefing = Briefing;
