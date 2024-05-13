import { FiHardDrive } from "react-icons/fi";
import NavItem from "./NavItem";
import { FaComputer } from "react-icons/fa6";
import { HiUsers } from "react-icons/hi";
import {
  AiOutlineClockCircle,
  AiOutlineCloud,
  AiOutlineStar,
} from "react-icons/ai";
import { RiSpam2Line } from "react-icons/ri";
import { BsTrash } from "react-icons/bs";

const Navbar = () => {
  return (
    <div className="grid-in-nav min-w-[256px] max-w-[394px] border-r-1 overflow-hidden">
      <div className="flex w-full h-full overflow-visible">
        <div className="flex p-0 mr-[6px] overflow-x-hidden overflow-y-auto">
          <div className="ml-4 overflow-auto invisible">
            <div className="mr-[10px] visible">
              <nav className="visible">
                <div className="w-full relative min-h-[80px] overflow-hidden">
                  <NavItem title="My drive" path="/drive" disabled={false}>
                    <FiHardDrive size={20} />
                  </NavItem>
                  <NavItem title="My computer" path="/my-drive" disabled>
                    <FaComputer size={20} />
                  </NavItem>
                  <NavItem title="Shared items" path="/my-drive" disabled>
                    <HiUsers size={20} />
                  </NavItem>
                  <NavItem
                    title="Recently used"
                    path="/my-drive"
                    disabled
                  >
                    <AiOutlineClockCircle size={20} />
                  </NavItem>
                  <NavItem title="Starred" path="/my-drive" disabled>
                    <AiOutlineStar size={20} />
                  </NavItem>
                  <NavItem title="Spam" path="/my-drive" disabled>
                    <RiSpam2Line size={20} />
                  </NavItem>
                  <NavItem title="Trash" path="/my-drive" disabled>
                    <BsTrash size={20} />
                  </NavItem>
                  <NavItem title="Storage" path="/my-drive" disabled>
                    <AiOutlineCloud size={20} />
                  </NavItem>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
