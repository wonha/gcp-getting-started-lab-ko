const MainItemsHeader = () => {
  return (
    <div className="flex flex-col pl-5 pr-3">
      <div className="flex flex-row items-center w-full pr-[2px] h-12 border-b border-solid border-b-[#dadce0] sticky pt-2 gap-x-2">
        <div className="grow min-w-[200px] text-[14px]">Name</div>
        <div className="flex-none w-[140px] text-[14px]">Owner</div>
        <div className="flex-none w-[156px] text-[14px]">Modified</div>
        <div className="flex-none w-[156px] text-[14px]">Size</div>
        <div className="flex-none w-[16px] text-[14px]">︙</div>
      </div>
    </div>
  );
};

export default MainItemsHeader;
