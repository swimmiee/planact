import { UpdateProofProps } from "@/modules/userDailyList/hooks"

export interface ProofProps {
    userevent_id: string
    updateProof: (props: UpdateProofProps) => Promise<boolean>
    proof: number | null
    title: string
    diary?: string
    photo?: File
}
export {default as Check} from "./Check"
export {default as Score} from "./Score"